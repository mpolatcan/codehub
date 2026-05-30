//! Native macOS "Dynamic Island" companion — a borderless `NSPanel` anchored
//! under the notch, floating above the menu bar, that mirrors live agent
//! activity. Replaces the webview companion on macOS (other platforms keep the
//! `WebviewWindow` companion in `lib.rs`).
//!
//! Behaviour:
//! - **Collapsed:** a notch-width pill showing a colored dot + running-agent
//!   count, tinted by the highest-priority row state.
//! - **Expanded:** a list of every session — a status dot/glyph + name + a live
//!   sub-line (`running <tool>` / `thinking` + tool count + turn clock, or
//!   `needs input` / `finished` / `failed`, or the Claude metric when idle).
//!   Clicking a row focuses its pane; an awaiting row carries inline ✕/✓ zones on
//!   its right edge that relay deny/approve to `respond_prompt` (via the main
//!   window). Expands on hover, or automatically (below).
//! - **Auto-pop:** the feed ([`drive`]) pops the island open to announce a row
//!   newly awaiting input, or a turn that just finished/failed, then collapses
//!   it back to the pill after a short window (awaiting holds it open until
//!   answered) — a Live-Activity-style nudge.
//!
//! Everything shown is the honest hook/activity signal (turn + tool counts, the
//! current tool, the last-turn outcome) — nothing is fabricated.
//!
//! Threading: AppKit objects are neither `Send` nor `Sync` and must only be
//! touched on the main thread, so the whole island lives in a main-thread
//! `thread_local!` and is only accessed inside `run_on_main_thread`. AppKit
//! event callbacks already run on the main thread, so they reach into the
//! `thread_local!` directly. A separate `AtomicBool` mirrors visibility so
//! cross-thread callers (e.g. the activity feed's `is_visible()` gate) can read
//! it without touching the panel.
#![cfg(target_os = "macos")]

use std::cell::RefCell;
use std::sync::atomic::{AtomicBool, Ordering};

use objc2::rc::Retained;
use objc2::runtime::AnyObject;
use objc2::{define_class, msg_send, AnyThread, MainThreadMarker, MainThreadOnly};
use objc2_app_kit::{
    NSBackingStoreType, NSColor, NSEvent, NSFont, NSPanel, NSScreen, NSStatusWindowLevel,
    NSTextAlignment, NSTextField, NSTrackingArea, NSTrackingAreaOptions, NSView,
    NSWindowCollectionBehavior, NSWindowStyleMask,
};
use objc2_foundation::{NSPoint, NSRect, NSSize, NSString};
use tauri::{AppHandle, Emitter, Manager};

/// Live status of one island row, mirroring the companion design's avatar
/// states. Derived from real signals only: `Live`/`Idle` from output flow;
/// `Wait` from `pending_prompts`; `Done`/`Err` from `stop`/`stop_failure` hook
/// events. NEVER fabricated — absent signal stays `Idle`.
#[derive(Clone, Copy, PartialEq, Eq, Default)]
pub enum IslandStatus {
    #[default]
    Idle,
    Live,
    Wait,
    Done,
    Err,
}

impl IslandStatus {
    /// Priority for the collapsed-pill summary tint: an awaiting prompt outranks
    /// an error, which outranks live work, which outranks idle.
    fn rank(self) -> u8 {
        match self {
            IslandStatus::Wait => 4,
            IslandStatus::Err => 3,
            IslandStatus::Live => 2,
            IslandStatus::Done => 1,
            IslandStatus::Idle => 0,
        }
    }
}

/// A rich island row: identity + status + live turn telemetry. The sub-line the
/// row renders is built from these REAL signals (see [`row_detail`]) — current
/// tool / thinking + turn elapsed while Live, "needs input"/"finished"/"failed"
/// for the transient states, the Claude metric when idle. Nothing is fabricated.
#[derive(Clone)]
pub struct IslandRow {
    /// Display label (alias or session name).
    pub label: String,
    /// tmux session name — the key the rest of the app uses (click → focus,
    /// approve → respond_prompt).
    pub session: String,
    /// Agent cli id ("claude"/"codex"/…) for the dot color; None = neutral.
    pub agent: Option<String>,
    pub status: IslandStatus,
    /// Honest, already-real metric line (Claude edits·tok); None → omitted.
    pub metric: Option<String>,
    /// Active model (e.g. "opus-4.7"); None when unknown.
    pub model: Option<String>,
    /// Git branch the session's workspace is on; None when unknown.
    pub branch: Option<String>,
    /// Tool executing right now (Some ⇒ "running <tool>"; None while Live ⇒
    /// "thinking"). Hook-driven, Claude-only today.
    pub current_tool: Option<String>,
    /// Turns + tool calls observed via hooks (0 for hook-less CLIs → omitted).
    pub turns: u64,
    pub tool_calls: u64,
    /// Elapsed ms of the in-flight turn (Some while Live), for the live clock.
    pub turn_ms: Option<u64>,
}

/// The full snapshot the rich feed pushes: the rows + whether any row is
/// awaiting input (drives the collapsed "approve" affordance + pill tint).
#[derive(Clone, Default)]
pub struct IslandSnapshot {
    pub rows: Vec<IslandRow>,
}

thread_local! {
    /// The live island, created lazily on first `show`. Main-thread only.
    static ISLAND: RefCell<Option<Island>> = const { RefCell::new(None) };
}

/// Cross-thread mirror of whether the island is currently on screen.
static VISIBLE: AtomicBool = AtomicBool::new(false);

/// Pill size when the display has no notch (older / external monitors).
const FALLBACK_W: f64 = 168.0;
/// Minimum collapsed pill height (also the header band when expanded).
const COLLAPSE_H: f64 = 26.0;
/// Smallest plausible notch width, guards a degenerate measurement.
const MIN_NOTCH_W: f64 = 80.0;
/// Expanded panel width / per-row height / vertical padding.
const EXPANDED_W: f64 = 248.0;
const ROW_H: f64 = 24.0;
const PAD: f64 = 8.0;

/// Live AppKit handles + layout state. All `Retained` fields are main-thread.
struct Island {
    app: AppHandle,
    panel: Retained<NSPanel>,
    view: Retained<IslandView>,
    header: Retained<NSTextField>,
    /// (dot, name) field pair per current row.
    rows: Vec<(Retained<NSTextField>, Retained<NSTextField>)>,
    /// Inline (deny ✕, approve ✓) labels — `Some` only for awaiting rows, index-
    /// aligned with `rows`. `handle_click` maps the row's right edge to deny /
    /// approve zones; non-awaiting rows click through to focus.
    actions: Vec<Option<(Retained<NSTextField>, Retained<NSTextField>)>>,
    /// Per-row click target + status, in row order. Index-aligned with `rows`.
    targets: Vec<(String, IslandStatus)>,
    /// Effective expansion (the applied frame state) = `feed_expanded || hovering`.
    expanded: bool,
    /// Expansion requested by the live feed (auto-pop on awaiting/finish/fail).
    feed_expanded: bool,
    /// Expansion from the mouse being over the pill (manual peek).
    hovering: bool,
    /// Collapsed-pill geometry for the current display (origin + size).
    pill: NSRect,
}

// ── Custom flipped NSView: owns hover tracking + click hit-testing ───────────

/// Empty ivars — all state lives in the `thread_local!` island.
struct IslandIvars;

define_class!(
    // Flipped so subview layout uses a top-left origin.
    #[unsafe(super(NSView))]
    #[name = "CodeHubIslandView"]
    #[ivars = IslandIvars]
    struct IslandView;

    impl IslandView {
        #[unsafe(method(isFlipped))]
        fn is_flipped(&self) -> bool {
            true
        }

        // Let a click land without first activating the app.
        #[unsafe(method(acceptsFirstMouse:))]
        fn accepts_first_mouse(&self, _event: Option<&NSEvent>) -> bool {
            true
        }

        #[unsafe(method(mouseEntered:))]
        fn mouse_entered(&self, _event: &NSEvent) {
            set_hovering(true);
        }

        #[unsafe(method(mouseExited:))]
        fn mouse_exited(&self, _event: &NSEvent) {
            set_hovering(false);
        }

        #[unsafe(method(mouseDown:))]
        fn mouse_down(&self, event: &NSEvent) {
            // Window coords → this view's flipped local coords.
            let win_pt = event.locationInWindow();
            let local = self.convertPoint_fromView(win_pt, None);
            handle_click(local.x, local.y);
        }
    }
);

impl IslandView {
    fn new(mtm: MainThreadMarker, frame: NSRect) -> Retained<Self> {
        let this = Self::alloc(mtm).set_ivars(IslandIvars);
        unsafe { msg_send![super(this), initWithFrame: frame] }
    }
}

// ── Public entry points (callable from any thread) ───────────────────────────

/// Whether the island is on screen. Safe to call from any thread.
pub fn is_visible() -> bool {
    VISIBLE.load(Ordering::Relaxed)
}

/// Show the island (creating it on first call), re-positioned under the notch so
/// it follows display changes. Idempotent.
pub fn show(app: &AppHandle) {
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        let mtm = MainThreadMarker::new().expect("run_on_main_thread is on the main thread");
        // Phase 1 (under borrow): create if needed, recompute notch geometry, and
        // capture the frame plan. Phase 2 applies it with the borrow released.
        let plan = ISLAND.with(|cell| {
            let mut slot = cell.borrow_mut();
            if slot.is_none() {
                *slot = Some(build(app, mtm));
            }
            let island = slot.as_mut().expect("island built above");
            update_pill(island, mtm);
            plan_frame(island)
        });
        apply_frame(&plan, false); // no animation on first/visibility show
        relayout();
        ISLAND.with(|cell| {
            if let Some(island) = cell.borrow().as_ref() {
                island.panel.orderFrontRegardless();
            }
        });
        VISIBLE.store(true, Ordering::Relaxed);
    });
}

/// Toggle the island on/off — show it when hidden, hide it when visible. Backs
/// the global shortcut (CmdOrCtrl+Shift+J). Safe to call from any thread (both
/// `show`/`hide` hop to the main thread internally).
pub fn toggle(app: &AppHandle) {
    if is_visible() {
        hide(app);
    } else {
        show(app);
    }
}

/// Hide the island without destroying it (cheap to re-show). Idempotent.
pub fn hide(app: &AppHandle) {
    let _ = app.run_on_main_thread(|| {
        ISLAND.with(|cell| {
            if let Some(island) = cell.borrow().as_ref() {
                island.panel.orderOut(None);
            }
        });
        VISIBLE.store(false, Ordering::Relaxed);
    });
}

/// Drive the island from one live feed tick. This is the entry point the
/// `lib.rs` setup-hook feed calls every ~1s with:
///   - `snapshot`: the per-agent rows (identity, status, live tool/turn telemetry)
///   - `want_present`: auto-pop — bring the island on screen if it's hidden
///     (the feed asserts this on a fresh awaiting / finished / failed event, so
///     the island announces itself like a Live Activity)
///   - `want_expanded`: drop the panel open (the feed holds this while any row is
///     awaiting input, and for a few seconds after a turn finishes/fails, then
///     lets it collapse back to the pill)
///
/// Auto-present reuses [`show`] (idempotent). Rows are rebuilt every tick; the
/// effective expansion is `want_expanded || hovering`, so a manual hover still
/// peeks. Cheap no-op when `want_present` is false and the island was never
/// shown.
pub fn drive(app: &AppHandle, snapshot: IslandSnapshot, want_present: bool, want_expanded: bool) {
    // Auto-present (pop) when the feed asks and we're hidden. `show` hops to the
    // main thread, builds/positions/orders-front, and sets VISIBLE; it's a no-op
    // when already up.
    if want_present && !is_visible() {
        show(app);
    }
    let _ = app.run_on_main_thread(move || {
        let mtm = MainThreadMarker::new().expect("run_on_main_thread is on the main thread");
        // Swap in the new rows + record the feed's desired expansion under one
        // borrow. If the island has never been shown (and we're not presenting),
        // there's no island to update — a cheap no-op.
        ISLAND.with(|cell| {
            if let Some(island) = cell.borrow_mut().as_mut() {
                rebuild_rows(island, &snapshot.rows, mtm);
                island.feed_expanded = want_expanded;
            }
        });
        // Re-derive effective expansion and reflow (forced so the panel height
        // tracks the new row count while expanded).
        apply_expansion(true);
    });
}

// ── Construction ─────────────────────────────────────────────────────────────

fn build(app: AppHandle, mtm: MainThreadMarker) -> Island {
    let pill = NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(FALLBACK_W, COLLAPSE_H));
    let style = NSWindowStyleMask::Borderless | NSWindowStyleMask::NonactivatingPanel;

    let panel = NSPanel::initWithContentRect_styleMask_backing_defer(
        NSPanel::alloc(mtm),
        pill,
        style,
        NSBackingStoreType::Buffered,
        false,
    );
    panel.setLevel(NSStatusWindowLevel); // float above the menu bar (level 24)
    panel.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::Stationary
            | NSWindowCollectionBehavior::FullScreenAuxiliary,
    );
    panel.setOpaque(false);
    let clear = NSColor::clearColor();
    panel.setBackgroundColor(Some(&clear));
    panel.setHasShadow(true);
    panel.setMovable(false);

    // Flipped content view that receives hover + click. Its own layer is the
    // CodeHub chrome: a solid `--color-panel` fill with a `--color-rule` hairline,
    // matching the app's panels (not a translucent macOS HUD blur).
    let view = IslandView::new(mtm, pill);
    view.setWantsLayer(true);
    if let Some(layer) = view.layer() {
        let bg = color_panel();
        layer.setBackgroundColor(Some(&bg.CGColor()));
        let border = color_rule();
        layer.setBorderColor(Some(&border.CGColor()));
        layer.setBorderWidth(1.0);
        layer.setCornerRadius(COLLAPSE_H / 2.0);
        layer.setMasksToBounds(true);
    }

    // Hover tracking that always matches the (resizing) visible rect.
    let opts = NSTrackingAreaOptions::MouseEnteredAndExited
        | NSTrackingAreaOptions::ActiveAlways
        | NSTrackingAreaOptions::InVisibleRect;
    let owner: &AnyObject = &view;
    // SAFETY: fresh allocation; `owner` (the view) outlives the area, which lives
    // as long as the view; no userInfo.
    let area = unsafe {
        NSTrackingArea::initWithRect_options_owner_userInfo(
            NSTrackingArea::alloc(),
            pill,
            opts,
            Some(owner),
            None,
        )
    };
    view.addTrackingArea(&area);

    // Collapsed header: dot + count.
    let header = label(mtm, "●", COLLAPSE_H - 12.0);
    header.setAlignment(NSTextAlignment::Center);
    header.setTextColor(Some(&status_color(IslandStatus::Idle)));
    let header_view: &NSView = &header;
    view.addSubview(header_view);

    let content: &NSView = &view;
    panel.setContentView(Some(content));

    let island = Island {
        app,
        panel,
        view,
        header,
        rows: Vec::new(),
        actions: Vec::new(),
        targets: Vec::new(),
        expanded: false,
        feed_expanded: false,
        hovering: false,
        pill,
    };
    layout(&island);
    island
}

// ── State transitions ─────────────────────────────────────────────────────────

/// Rebuild the row views from a fresh snapshot and refresh the collapsed count.
/// Pure state mutation — no panel frame change, so it is safe to run while the
/// `ISLAND` borrow is held. Layout/reframe happen afterwards, borrow-free.
fn rebuild_rows(island: &mut Island, rows: &[IslandRow], mtm: MainThreadMarker) {
    // Tear down old row views.
    for (dot, name) in island.rows.drain(..) {
        dot.removeFromSuperview();
        name.removeFromSuperview();
    }
    for (deny, approve) in island.actions.drain(..).flatten() {
        deny.removeFromSuperview();
        approve.removeFromSuperview();
    }
    island.targets.clear();

    for row in rows {
        let dot = label(mtm, status_glyph(row.status), 11.0);
        dot.setTextColor(Some(&status_color(row.status)));
        // Name line carries the live, REAL detail for the row's state (running
        // <tool> · N tools · turn clock / needs input / finished / failed / the
        // Claude metric when idle). No fabricated suffix otherwise.
        let detail = row_detail(row);
        let line = if detail.is_empty() {
            row.label.clone()
        } else {
            format!("{}  · {detail}", row.label)
        };
        let name = label(mtm, &line, 12.0);
        name.setTextColor(Some(&color_text()));
        name.setHidden(!island.expanded);
        dot.setHidden(!island.expanded);
        let dv: &NSView = &dot;
        let nv: &NSView = &name;
        island.view.addSubview(dv);
        island.view.addSubview(nv);
        island.rows.push((dot, name));
        island.targets.push((row.session.clone(), row.status));

        // Awaiting rows get inline Deny (✕) / Approve (✓) affordances on the
        // right; `handle_click` maps the row's right edge to their zones.
        if row.status == IslandStatus::Wait {
            let deny = label(mtm, "✕", 12.0);
            deny.setTextColor(Some(&color_text()));
            deny.setHidden(!island.expanded);
            let approve = label(mtm, "✓", 12.0);
            approve.setTextColor(Some(&status_color(IslandStatus::Live)));
            approve.setHidden(!island.expanded);
            let dv2: &NSView = &deny;
            let av2: &NSView = &approve;
            island.view.addSubview(dv2);
            island.view.addSubview(av2);
            island.actions.push(Some((deny, approve)));
        } else {
            island.actions.push(None);
        }
    }

    // Collapsed pill shows the running-agent count, tinted by the highest-rank
    // status across all rows (awaiting > error > live > done > idle). A "!"
    // marker replaces the dot when any row is awaiting input, so the pill reads
    // as "needs you" at a glance even while collapsed.
    let top = rows
        .iter()
        .map(|r| r.status)
        .max_by_key(|s| s.rank())
        .unwrap_or_default();
    let marker = if top == IslandStatus::Wait {
        "!"
    } else {
        "●"
    };
    island
        .header
        .setStringValue(&NSString::from_str(&format!("{marker} {}", rows.len())));
    island.header.setTextColor(Some(&status_color(top)));
}

/// Set the hover flag (manual peek) and re-derive the effective expansion.
fn set_hovering(hovering: bool) {
    ISLAND.with(|cell| {
        if let Some(island) = cell.borrow_mut().as_mut() {
            island.hovering = hovering;
        }
    });
    refresh_expansion();
}

/// Re-derive the effective expansion (`feed_expanded || hovering`) and resize the
/// panel to match. `force_reframe` additionally re-applies the frame when already
/// expanded — the feed sets it so the panel height tracks a changed row count.
/// Animates only on an actual expand/collapse toggle (a forced row-count reflow
/// is instant, so the panel doesn't re-animate every feed tick).
///
/// The visibility flips happen under the borrow; the resize is applied AFTER the
/// borrow is dropped, because `setFrame…animate:true` can pump a nested run loop
/// that synchronously re-enters the hover callbacks — re-borrowing `ISLAND` then
/// would panic.
fn apply_expansion(force_reframe: bool) {
    let res = ISLAND.with(|cell| {
        let mut slot = cell.borrow_mut();
        let island = slot.as_mut()?;
        let want = island.feed_expanded || island.hovering;
        let changed = island.expanded != want;
        // Apply on a toggle, or on a forced reflow while expanded (row-count change).
        let should_apply = changed || (force_reframe && want);
        if !should_apply {
            return None;
        }
        island.expanded = want;
        for (dot, name) in &island.rows {
            dot.setHidden(!want);
            name.setHidden(!want);
        }
        for (deny, approve) in island.actions.iter().flatten() {
            deny.setHidden(!want);
            approve.setHidden(!want);
        }
        // The collapsed count is hidden once the rows take over.
        island.header.setHidden(want);
        Some((plan_frame(island), changed))
    });
    if let Some((plan, changed)) = res {
        apply_frame(&plan, changed);
        relayout();
    }
}

/// Re-derive effective expansion after a hover change (no forced reframe).
fn refresh_expansion() {
    apply_expansion(false);
}

/// A click at flipped local-(x,y); resolve the row it lands on (expanded only).
/// An awaiting row's right edge carries deny (✕) / approve (✓) zones that relay
/// to the main window; clicking anywhere else on a row focuses its terminal pane.
fn handle_click(local_x: f64, local_y: f64) {
    enum Act {
        Focus(AppHandle, String),
        Approve(AppHandle, String),
        Deny(AppHandle, String),
    }
    let act = ISLAND.with(|cell| {
        let borrow = cell.borrow();
        let island = borrow.as_ref()?;
        if !island.expanded || local_y < COLLAPSE_H {
            return None;
        }
        let idx = ((local_y - COLLAPSE_H) / ROW_H) as usize;
        let (session, _status) = island.targets.get(idx)?.clone();
        let app = island.app.clone();
        // Awaiting rows: right edge = approve (✓) zone, then deny (✕) just left.
        // Mirror the glyph frames in `layout` (approve at w-26, deny at w-50).
        if island
            .actions
            .get(idx)
            .map(|a| a.is_some())
            .unwrap_or(false)
        {
            let w = island.view.bounds().size.width;
            if local_x >= w - 30.0 {
                return Some(Act::Approve(app, session));
            }
            if local_x >= w - 54.0 {
                return Some(Act::Deny(app, session));
            }
        }
        Some(Act::Focus(app, session))
    });
    match act {
        Some(Act::Approve(app, session)) => approve_session(&app, &session),
        Some(Act::Deny(app, session)) => deny_session(&app, &session),
        Some(Act::Focus(app, session)) => focus_session(&app, &session),
        None => {},
    }
}

// ── Layout / geometry ─────────────────────────────────────────────────────────

/// Cloned handles + the target panel frame for the current state. Computed under
/// the `ISLAND` borrow, then applied to AppKit with the borrow released.
struct FramePlan {
    panel: Retained<NSPanel>,
    view: Retained<IslandView>,
    frame: NSRect,
    radius: f64,
}

/// Compute the target panel frame for the current expanded/collapsed state,
/// top-anchored at the notch.
fn plan_frame(island: &Island) -> FramePlan {
    let p = island.pill;
    let (frame, radius) = if island.expanded {
        let w = EXPANDED_W.max(p.size.width);
        let h = COLLAPSE_H + island.rows.len() as f64 * ROW_H + PAD;
        // Keep the top edge pinned; grow downward and center horizontally.
        let top = p.origin.y + p.size.height;
        let x = p.origin.x + (p.size.width - w) / 2.0;
        (
            NSRect::new(NSPoint::new(x, top - h), NSSize::new(w, h)),
            14.0,
        )
    } else {
        (p, p.size.height / 2.0)
    };
    FramePlan {
        panel: island.panel.clone(),
        view: island.view.clone(),
        frame,
        radius,
    }
}

/// Apply a [`FramePlan`] to AppKit. MUST be called with the `ISLAND` borrow
/// released — `animate:true` may pump a nested run loop that re-enters hover
/// callbacks.
fn apply_frame(plan: &FramePlan, animate: bool) {
    plan.panel
        .setFrame_display_animate(plan.frame, true, animate);
    if let Some(layer) = plan.view.layer() {
        layer.setCornerRadius(plan.radius);
    }
}

/// Re-run the internal subview layout under a short read borrow. Safe because
/// `layout` only sets subview frames (no window animate / nested run loop).
fn relayout() {
    ISLAND.with(|cell| {
        if let Some(island) = cell.borrow().as_ref() {
            layout(island);
        }
    });
}

/// Recompute the collapsed pill rect for the current display (notch geometry, or
/// top-center fallback) and store it on the island. Pure state — no AppKit frame
/// change.
fn update_pill(island: &mut Island, mtm: MainThreadMarker) {
    let Some(screen) = NSScreen::mainScreen(mtm) else {
        return;
    };
    let f = screen.frame();
    let notch_h = screen.safeAreaInsets().top;
    let (w, h) = if notch_h > 0.0 {
        let left = screen.auxiliaryTopLeftArea();
        let right = screen.auxiliaryTopRightArea();
        let notch_w = (f.size.width - left.size.width - right.size.width).max(MIN_NOTCH_W);
        (notch_w, notch_h)
    } else {
        (FALLBACK_W, COLLAPSE_H)
    };
    let x = f.origin.x + (f.size.width - w) / 2.0;
    // AppKit screen coords are bottom-left origin: top edge = origin.y + height.
    let y = f.origin.y + f.size.height - h;
    island.pill = NSRect::new(NSPoint::new(x, y), NSSize::new(w, h));
}

/// Position the header and rows inside the current content bounds (flipped,
/// top-left origin). The panel fill/border/radius live on the view's own layer
/// (set in `build`, radius updated in `apply_frame`), so there is no blur subview
/// to size here.
fn layout(island: &Island) {
    let bounds = island.view.bounds();
    let w = bounds.size.width;

    // Header centered in the top band.
    island.header.setFrame(NSRect::new(
        NSPoint::new(0.0, 4.0),
        NSSize::new(w, COLLAPSE_H - 8.0),
    ));

    // Rows stacked under the header.
    for (i, (dot, name)) in island.rows.iter().enumerate() {
        let y = COLLAPSE_H + i as f64 * ROW_H;
        dot.setFrame(NSRect::new(
            NSPoint::new(12.0, y + 4.0),
            NSSize::new(14.0, ROW_H - 8.0),
        ));
        // Awaiting rows reserve the right ~52px for the deny/approve glyphs.
        let action = island.actions.get(i).and_then(|a| a.as_ref());
        let name_w = if action.is_some() {
            (w - 92.0).max(40.0)
        } else {
            w - 40.0
        };
        name.setFrame(NSRect::new(
            NSPoint::new(30.0, y + 3.0),
            NSSize::new(name_w, ROW_H - 6.0),
        ));
        if let Some((deny, approve)) = action {
            deny.setFrame(NSRect::new(
                NSPoint::new(w - 50.0, y + 3.0),
                NSSize::new(20.0, ROW_H - 6.0),
            ));
            approve.setFrame(NSRect::new(
                NSPoint::new(w - 26.0, y + 3.0),
                NSSize::new(20.0, ROW_H - 6.0),
            ));
        }
    }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/// A non-editable, transparent label in the monospaced system font (closest
/// native match to the app's JetBrains Mono chrome).
fn label(mtm: MainThreadMarker, text: &str, size: f64) -> Retained<NSTextField> {
    let field = NSTextField::labelWithString(&NSString::from_str(text), mtm);
    let font = NSFont::monospacedSystemFontOfSize_weight(size, 0.0);
    field.setFont(Some(&font));
    field
}

/// sRGB color from 8-bit channels (matches the `@theme` hex tokens 1:1).
fn srgb(r: u8, g: u8, b: u8) -> Retained<NSColor> {
    NSColor::colorWithSRGBRed_green_blue_alpha(
        f64::from(r) / 255.0,
        f64::from(g) / 255.0,
        f64::from(b) / 255.0,
        1.0,
    )
}

/// `--color-panel` #16181c — the island fill.
fn color_panel() -> Retained<NSColor> {
    srgb(0x16, 0x18, 0x1c)
}
/// `--color-rule` #2a2e35 — the island hairline border.
fn color_rule() -> Retained<NSColor> {
    srgb(0x2a, 0x2e, 0x35)
}
/// `--color-text` #c9cdd4 — primary label text.
fn color_text() -> Retained<NSColor> {
    srgb(0xc9, 0xcd, 0xd4)
}

/// Status dot/pill color, mirroring the design state tokens (sRGB conversions of
/// the oklch accents in `tokens.css`):
/// - `Live`  → `--live`  green  (working turn in progress)
/// - `Wait`  → `--wait`  amber  (awaiting input)
/// - `Done`  → `--done`  cyan   (turn finished)
/// - `Err`   → `--err`   red    (failed)
/// - `Idle`  → `--fg-3`  faint  (quiet / at rest)
fn status_color(status: IslandStatus) -> Retained<NSColor> {
    match status {
        IslandStatus::Live => srgb(0x4a, 0xd6, 0x6d), // oklch(0.80 0.17 145)
        IslandStatus::Wait => srgb(0xe6, 0xae, 0x3c), // oklch(0.83 0.14 80)
        IslandStatus::Done => srgb(0x6c, 0xb8, 0xc4), // oklch(0.78 0.08 200)
        IslandStatus::Err => srgb(0xe2, 0x55, 0x3d),  // oklch(0.72 0.18 25)
        IslandStatus::Idle => srgb(0x3f, 0x44, 0x4d), // --fg-3
    }
}

/// Per-row glyph: a check for a finished turn, a "!" for awaiting, else a dot.
fn status_glyph(status: IslandStatus) -> &'static str {
    match status {
        IslandStatus::Wait => "!",
        IslandStatus::Done => "✓",
        IslandStatus::Err => "×",
        _ => "●",
    }
}

/// The live sub-line shown after a row's label, built from REAL signals only:
/// - `Wait`  → "needs input"
/// - `Done`  → "finished"   (transient, ~6s after the turn ended)
/// - `Err`   → "failed"
/// - `Live`  → "running <tool>" / "thinking", plus tool count + the turn clock
/// - `Idle`  → the Claude metric (edits·tok) when present, else empty
fn row_detail(row: &IslandRow) -> String {
    match row.status {
        IslandStatus::Wait => "needs input".to_string(),
        IslandStatus::Err => "failed".to_string(),
        IslandStatus::Done => "finished".to_string(),
        IslandStatus::Live => {
            let mut s = match &row.current_tool {
                Some(t) => format!("running {t}"),
                None => "thinking".to_string(),
            };
            if row.tool_calls > 0 {
                let plural = if row.tool_calls == 1 { "" } else { "s" };
                s.push_str(&format!(" · {} tool{plural}", row.tool_calls));
            }
            if let Some(ms) = row.turn_ms {
                s.push_str(&format!(" · {}", fmt_clock(ms)));
            }
            s
        },
        IslandStatus::Idle => row.metric.clone().unwrap_or_default(),
    }
}

/// Turn clock "0:42" / "3:05" / "1:02:33" from elapsed milliseconds.
fn fmt_clock(ms: u64) -> String {
    let total = ms / 1000;
    let (h, m, s) = (total / 3600, (total % 3600) / 60, total % 60);
    if h > 0 {
        format!("{h}:{m:02}:{s:02}")
    } else {
        format!("{m}:{s:02}")
    }
}

/// Raise + focus the main window and ask the app to focus the named session.
/// Mirrors the `focus_session_from_companion` command used by the webview build.
fn focus_session(app: &AppHandle, name: &str) {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.set_focus();
    }
    let _ = app.emit("codehub://focus-session", name);
}

/// Relay an approve/deny intent for an awaiting row to the main window (the
/// island can't invoke the `respond_prompt` Tauri command from a raw AppKit
/// click). Payload is the tmux session name — App.tsx listens and calls
/// `respond_prompt(session, allow)`.
fn approve_session(app: &AppHandle, name: &str) {
    let _ = app.emit("codehub://island-approve", name);
}
fn deny_session(app: &AppHandle, name: &str) {
    let _ = app.emit("codehub://island-deny", name);
}
