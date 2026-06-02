//! Native macOS Dynamic Island — a transparent, borderless, always-on-top
//! `WebviewWindow` pinned under the notch that renders the REAL CodeHub design
//! system (the `#/island` React route), floated above the menu bar by a thin
//! objc2 NSWindow level/collection shim.
//!
//! This replaces the old hand-drawn AppKit `NSPanel`: drawing the notch surface
//! in raw `NSTextField`s could never reuse Tailwind/shadcn/tokens, so it always
//! drifted from the app. As a webview it IS the app's design system (JetBrains
//! Mono, `--a-*` accents, `.term` syntax classes, shadcn buttons).
//!
//! Division of labor — this module owns ONLY what a webview can't:
//!   - create the window (transparent, borderless, non-activating)
//!   - raise it above the menu bar (`NSStatusWindowLevel` + collection behavior)
//!   - position/resize it at the notch
//!
//! ALL announce/dismiss/which-session logic + rendering lives in the React
//! route, which polls `session_activity` + `pending_prompts` (like the companion
//! did) and calls `island_present` / `island_dismiss` / `resize_island`.
//!
//! Threading: NSWindow is main-thread-only, so every native touch hops through
//! `WebviewWindow::run_on_main_thread`. A separate `AtomicBool` mirrors
//! visibility for cross-thread callers.
#![cfg(target_os = "macos")]

use std::ptr::NonNull;
use std::sync::atomic::{AtomicBool, AtomicI64, Ordering};

use block2::RcBlock;
use objc2::rc::Retained;
use objc2::MainThreadMarker;
use objc2_app_kit::{
    NSColor, NSEvent, NSEventMask, NSScreen, NSStatusWindowLevel, NSWindow,
    NSWindowCollectionBehavior, NSWorkspace, NSWorkspaceActiveSpaceDidChangeNotification,
};
use objc2_foundation::{
    NSActivityOptions, NSNotification, NSPoint, NSProcessInfo, NSRect, NSSize, NSString, NSTimer,
};
use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindow, WebviewWindowBuilder};

/// Window label — also the second-window identity the rest of the app keys on.
const LABEL: &str = "island";
/// Initial size before the React route reports its content size via `resize`.
const INIT_W: f64 = 460.0;
const INIT_H: f64 = 150.0;

/// Cross-thread mirror of whether the island is currently on screen.
static VISIBLE: AtomicBool = AtomicBool::new(false);
/// Cursor currently inside the island frame — dedup so hover events fire only on
/// boundary crossings, not on every mouse-move tick.
static HOVERED: AtomicBool = AtomicBool::new(false);
/// Hover mouse-monitors installed once (global + local NSEvent monitors).
static MONITORS_INSTALLED: AtomicBool = AtomicBool::new(false);
/// Last cursor position pushed to the webview (window-local points, packed
/// `x<<32 | y`). Dedup so `island://cursor` fires only when it actually moved.
static LAST_CURSOR: AtomicI64 = AtomicI64::new(i64::MIN);

/// Whether the island is on screen. Safe from any thread.
pub fn is_visible() -> bool {
    VISIBLE.load(Ordering::Relaxed)
}

/// Create the hidden island window if it does not exist yet. Its React route
/// starts polling immediately; the window stays hidden until `present`. Cheap
/// no-op when already created.
pub fn ensure(app: &AppHandle) {
    if app.get_webview_window(LABEL).is_some() {
        return;
    }
    let built = WebviewWindowBuilder::new(app, LABEL, WebviewUrl::App("index.html#/island".into()))
        .title("CodeHub Island")
        .inner_size(INIT_W, INIT_H)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .shadow(false)
        .resizable(false)
        .focused(false)
        .visible(false)
        .skip_taskbar(true)
        // The island is a non-activating overlay: without this, the FIRST click on
        // it is swallowed to activate the window (you'd need a double-click to hit a
        // row). `accept_first_mouse` routes that first click straight to the webview
        // so a single click jumps to the terminal even when CodeHub is in the back.
        .accept_first_mouse(true)
        .build();
    match built {
        Ok(win) => apply_native(&win),
        Err(e) => tracing::warn!("island window build failed: {e}"),
    }
}

/// Show + raise above the menu bar, repositioned at the notch. Idempotent.
pub fn present(app: &AppHandle) {
    ensure(app);
    if let Some(win) = app.get_webview_window(LABEL) {
        // Show FIRST, then set the frame: a hidden/just-shown window can have its
        // frame re-constrained below the menu bar, so position it once it's live.
        let _ = win.show();
        place(&win, true, None);
        raise(&win);
        VISIBLE.store(true, Ordering::Relaxed);
    }
}

/// Hide without destroying — the React route keeps polling so it can re-present
/// on the next event. Idempotent.
pub fn dismiss(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(LABEL) {
        let _ = win.hide();
    }
    VISIBLE.store(false, Ordering::Relaxed);
}

/// Show when hidden, hide when visible. Backs the global ⌘⇧J shortcut.
pub fn toggle(app: &AppHandle) {
    if is_visible() {
        dismiss(app);
    } else {
        present(app);
    }
}

/// Resize to the React content size (incl. its shadow margin), re-anchoring the
/// top edge. Stays on the window's CURRENT screen (not the cursor's) so a morph
/// never yanks the island to another display mid-resize.
pub fn resize(app: &AppHandle, w: f64, h: f64) {
    if let Some(win) = app.get_webview_window(LABEL) {
        place(&win, false, Some(NSSize::new(w.max(160.0), h.max(48.0))));
    }
}

/// Tear the window down (master disable). `ensure` rebuilds it on re-enable.
pub fn destroy(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(LABEL) {
        let _ = win.close();
    }
    VISIBLE.store(false, Ordering::Relaxed);
}

// ── Native (main-thread) helpers ────────────────────────────────────────────

/// Run `f` against the window's `NSWindow` on the main thread. No-op if the
/// native handle can't be resolved.
fn with_ns_window<F>(win: &WebviewWindow, f: F)
where
    F: FnOnce(&NSWindow, MainThreadMarker) + Send + 'static,
{
    let win = win.clone();
    let _ = win.clone().run_on_main_thread(move || {
        let Some(mtm) = MainThreadMarker::new() else {
            return;
        };
        if let Ok(ptr) = win.ns_window() {
            // SAFETY: Tauri hands back the live `NSWindow` for this webview; we
            // only borrow it for the duration of `f`, on the main thread.
            let ns: &NSWindow = unsafe { &*(ptr.cast::<NSWindow>()) };
            f(ns, mtm);
        }
    });
}

/// One-time native setup: float above the menu bar, join all spaces, clear
/// background (so only the rounded React card paints), no native shadow/move.
fn apply_native(win: &WebviewWindow) {
    let app = win.app_handle().clone();
    with_ns_window(win, move |ns, _mtm| {
        float_on_all_spaces(ns);
        ns.setMovable(false);
        ns.setOpaque(false);
        let clear = NSColor::clearColor();
        ns.setBackgroundColor(Some(&clear));
        ns.setHasShadow(false);
        install_hover_monitors(&app);
    });
}

/// On each mouse-move, recompute whether the cursor is inside the island frame and,
/// only on a boundary crossing, push `island://hover` to the webview so it
/// expands/collapses. Per-move cost is a couple of FFI reads + a bounds check; the
/// emit fires solely on transitions. Main-thread only (the NSEvent monitors run on
/// the main run loop).
fn hover_tick(app: &AppHandle) {
    let Some(win) = app.get_webview_window(LABEL) else {
        return;
    };
    // Only track while the island is on screen; clear a stale hover otherwise.
    if !is_visible() {
        if HOVERED.swap(false, Ordering::Relaxed) {
            let _ = app.emit("island://hover", false);
        }
        return;
    }
    let Ok(ptr) = win.ns_window() else {
        return;
    };
    // SAFETY: the live `NSWindow` for the island webview, borrowed on the main
    // thread for the duration of this read.
    let ns: &NSWindow = unsafe { &*(ptr.cast::<NSWindow>()) };
    let p = NSEvent::mouseLocation();
    let f = ns.frame();
    // Follow the active screen: if the cursor is now on a different display than the
    // island, move it there (and skip this tick's hover calc — the frame is about to
    // change). The island's host screen is resolved from its frame CENTER (robust for
    // an above-the-menu-bar window where `-screen` can be flaky), falling back to
    // `-screen`. Only fires on a real screen crossing, so it's near-free per move.
    if let Some(mtm) = MainThreadMarker::new() {
        let center = NSPoint::new(
            f.origin.x + f.size.width / 2.0,
            f.origin.y + f.size.height / 2.0,
        );
        let have = screen_at(center, mtm).or_else(|| ns.screen());
        let want = screen_at(p, mtm);
        if let (Some(have), Some(want)) = (have, want) {
            let (a, b) = (have.frame().origin, want.frame().origin);
            if a.x != b.x || a.y != b.y {
                tracing::debug!("island: cursor crossed to a new screen — re-placing");
                place(&win, true, None);
                return;
            }
        }
    }
    let inside = p.x >= f.origin.x
        && p.x <= f.origin.x + f.size.width
        && p.y >= f.origin.y
        && p.y <= f.origin.y + f.size.height;
    if inside != HOVERED.swap(inside, Ordering::Relaxed) {
        // Boundary crossing only (not every move). If this never logs while you hover
        // the island, no mouse monitor is reaching `hover_tick` (see the install
        // warnings); if it logs but the island doesn't expand, the webview isn't
        // receiving `island://hover` (event-listener / focus issue, not native).
        tracing::debug!(inside, "island: hover boundary crossing");
        let _ = app.emit("island://hover", inside);
    }
    // Push the cursor's window-LOCAL position so the webview can drive inner-element
    // hover (row/jump highlight) via `elementFromPoint`. CSS `:hover` is frozen while
    // CodeHub is backgrounded — the OS delivers mouse-moved only to the active app's
    // windows — so the expanded roster never lit up under the pointer. The poll knows
    // the cursor at any time, so we convert it to viewport coords (Cocoa points ==
    // CSS px; flip Y from the bottom-left frame origin to a top-left viewport origin;
    // the window top-left == viewport (0,0)) and let the frontend hit-test. Emitted
    // only while inside the frame, deduped to integer-point moves.
    if inside {
        let lx = (p.x - f.origin.x).round() as i32;
        let ly = ((f.origin.y + f.size.height) - p.y).round() as i32;
        let packed = (i64::from(lx) << 32) | (i64::from(ly) & 0xFFFF_FFFF);
        if LAST_CURSOR.swap(packed, Ordering::Relaxed) != packed {
            let _ = app.emit("island://cursor", CursorPos { x: lx, y: ly });
        }
    }
}

/// Cursor position in island webview-LOCAL coordinates (CSS px, top-left origin),
/// pushed as `island://cursor` so the React route can `elementFromPoint` it and
/// drive inner-element hover while CodeHub is backgrounded.
#[derive(Clone, Copy, serde::Serialize)]
struct CursorPos {
    x: i32,
    y: i32,
}

/// Install global + local mouse-move monitors so hover-expand works whether or not
/// CodeHub is the active app. The GLOBAL monitor fires while another app is active
/// (events route elsewhere); the LOCAL monitor fires while CodeHub is active (the
/// island is a non-key window, so its webview would not otherwise see mouse-moved).
/// Idempotent; must run on the main thread. The monitor tokens are leaked on
/// purpose — they live for the whole app session.
fn install_hover_monitors(app: &AppHandle) {
    if MONITORS_INSTALLED.swap(true, Ordering::Relaxed) {
        return;
    }
    // Opt out of App Nap (once) so the island stays live while CodeHub is
    // backgrounded — see `disable_app_nap`.
    disable_app_nap();
    let g = app.clone();
    let global = RcBlock::new(move |_e: NonNull<NSEvent>| hover_tick(&g));
    // Keep the monitor alive by leaking its token (app-session lifetime).
    let global_token =
        NSEvent::addGlobalMonitorForEventsMatchingMask_handler(NSEventMask::MouseMoved, &global);
    // A nil token = macOS refused the GLOBAL monitor → hover-expand won't fire while
    // CodeHub is BACKGROUNDED (cursor over the island with another app frontmost).
    // NB: NSEvent *mouse* monitors do NOT require the Input Monitoring (TCC
    // ListenEvent) grant — that gates KEYBOARD monitors + CGEventTap/IOHIDManager
    // only. So a nil here is an OS/build fault, NOT a missing privacy permission;
    // there is deliberately no permission prompt (it would request an unneeded
    // grant). The LOCAL monitor below still drives hover whenever CodeHub is focused.
    if global_token.is_none() {
        tracing::warn!(
            "island: global mouse monitor not installed — backgrounded hover-expand disabled"
        );
    }
    std::mem::forget(global_token);

    let l = app.clone();
    let local = RcBlock::new(move |e: NonNull<NSEvent>| -> *mut NSEvent {
        hover_tick(&l);
        e.as_ptr() // pass the event through unchanged (don't swallow mouse-moved)
    });
    // SAFETY: the block returns the original (valid, non-null) event pointer.
    let local_token = unsafe {
        NSEvent::addLocalMonitorForEventsMatchingMask_handler(NSEventMask::MouseMoved, &local)
    };
    if local_token.is_none() {
        tracing::warn!("island: local mouse monitor not installed — focused hover-expand disabled");
    }
    std::mem::forget(local_token);

    tracing::info!("island: hover monitors installed");
    install_hover_poll(app);
    install_space_observer(app);
}

/// Poll the cursor on a main-run-loop timer so hover is detected even when CodeHub
/// is BACKGROUNDED. Verified empirically: the global `NSEvent` mouse monitor
/// delivers ZERO events while another app is frontmost (it silently never fires
/// without the Input Monitoring grant — which we deliberately do NOT demand for a
/// notch widget). `NSEvent::mouseLocation()` needs no permission and is readable at
/// any time, so a ~20 Hz timer calling `hover_tick` covers the background case; the
/// LOCAL monitor still gives instant response while CodeHub is active. Cost is one
/// bounds check per tick, and `hover_tick` early-returns while the island is hidden.
/// Scheduled on the main run loop (we are on the main thread here); App Nap is
/// disabled so the run loop keeps pumping the timer while backgrounded. The timer is
/// leaked to live for the app session.
fn install_hover_poll(app: &AppHandle) {
    let a = app.clone();
    let block = RcBlock::new(move |_t: NonNull<NSTimer>| {
        hover_tick(&a);
    });
    // SAFETY: standard repeating timer; the block borrows nothing past its call.
    let timer =
        unsafe { NSTimer::scheduledTimerWithTimeInterval_repeats_block(0.05, true, &block) };
    std::mem::forget(timer);
}

/// Disable App Nap for the whole process. macOS suppresses a non-frontmost
/// `.regular` app: its timers are throttled, its WKWebView rendering is paused,
/// and `NSWorkspace` notification blocks are coalesced/delayed. That broke the
/// island two ways while another app was active — (1) hover-expand only animated
/// AFTER a click "woke" the webview, and (2) the active-Space observer fired late
/// or never, so the island failed to realize on other Spaces. Beginning a long-
/// lived user-initiated activity opts the process out of App Nap; we keep idle
/// SYSTEM sleep allowed (we only need the app awake, not the machine). The
/// returned activity token is leaked so it lasts the whole app session — dropping
/// it would re-enable App Nap. Main-thread only (called from the setup path).
fn disable_app_nap() {
    let pi = NSProcessInfo::processInfo();
    let reason = NSString::from_str("CodeHub Dynamic Island stays live while backgrounded");
    let token = pi.beginActivityWithOptions_reason(
        NSActivityOptions::UserInitiatedAllowingIdleSystemSleep,
        &reason,
    );
    std::mem::forget(token);
    tracing::info!("island: App Nap disabled (overlay stays live while backgrounded)");
}

/// Re-float the island onto the active Space whenever the user switches Spaces.
/// `CanJoinAllSpaces` is *supposed* to keep the window on every Space, but tao
/// re-applies the window's level/collection-behavior on focus/level changes and can
/// drop ours — leaving the island only on the Space where it was last presented.
/// Observing `NSWorkspaceActiveSpaceDidChangeNotification` and re-asserting (level +
/// collection behavior + order-front) on each switch keeps it present everywhere.
/// The notification posts on the main thread, so the re-raise is main-thread safe.
fn install_space_observer(app: &AppHandle) {
    let a = app.clone();
    let block = RcBlock::new(move |_n: NonNull<NSNotification>| {
        if !is_visible() {
            return;
        }
        let Some(win) = a.get_webview_window(LABEL) else {
            return;
        };
        let Ok(ptr) = win.ns_window() else {
            return;
        };
        // SAFETY: `NSWorkspaceActiveSpaceDidChangeNotification` is delivered on the
        // main thread, so we are on the main thread here and may borrow the live
        // island NSWindow directly for this call — WITHOUT `run_on_main_thread`.
        // That async hop was the bug: its queued closure was delayed/dropped while
        // CodeHub sat backgrounded on another Space, so the re-raise's `orderFront`
        // never ran and the (CanJoinAllSpaces) window never realized on the newly
        // active Space. Doing it inline (like `hover_tick`) fixes the follow.
        let ns: &NSWindow = unsafe { &*(ptr.cast::<NSWindow>()) };
        tracing::debug!("island: active Space changed — re-floating + raising");
        float_on_all_spaces(ns);
        ns.orderFrontRegardless();
    });
    let center = NSWorkspace::sharedWorkspace().notificationCenter();
    // SAFETY: standard observer registration; the name is the framework's static
    // notification name, no object filter, default (posting-thread) delivery. The
    // returned token is leaked so the observer lives for the whole app session.
    let token = unsafe {
        center.addObserverForName_object_queue_usingBlock(
            Some(NSWorkspaceActiveSpaceDidChangeNotification),
            None,
            None,
            &block,
        )
    };
    std::mem::forget(token);
}

/// Float above the menu bar and join the regular Desktop Spaces. Re-asserted on each
/// `present` because macOS can drop the level / collection behavior across Space
/// switches and display reconfigs — without the re-assert the island only showed on
/// the Space where it was first created.
///
/// `Stationary` is deliberately OMITTED — it lives in the Managed/Transient
/// exclusivity group and, combined with `CanJoinAllSpaces`, made macOS refuse to join
/// the window to other Spaces at all. `CanJoinAllSpaces | FullScreenAuxiliary` joins
/// every normal Desktop; the behavior only "realizes" on a Space once the window is
/// ordered-front while that Space is active, so the Space-change observer re-asserts
/// this + `orderFrontRegardless` INLINE on each switch (see `install_space_observer`).
///
/// KNOWN LIMITATION (accepted): the island does NOT appear over OTHER apps'
/// full-screen Spaces. A `.regular` Dock app can't reliably overlay another app's
/// full-screen Space with public AppKit alone (`isOnActiveSpace()` stays false there
/// despite `FullScreenAuxiliary`); the apps that manage it are menu-bar/agent
/// (`LSUIElement`) apps and/or use the private SkyLight/CGS space-injection API. We
/// chose not to take on a private-API dependency, so full-screen overlay is out.
fn float_on_all_spaces(ns: &NSWindow) {
    ns.setLevel(NSStatusWindowLevel);
    ns.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::FullScreenAuxiliary,
    );
}

fn raise(win: &WebviewWindow) {
    with_ns_window(win, |ns, _mtm| {
        float_on_all_spaces(ns);
        ns.orderFrontRegardless();
    });
}

/// Notch geometry (px) emitted to the React route as `island://notch`: the strip
/// `height` (= notch / menu-bar height) and the camera dead-zone `width` content
/// must flank. Both 0 on a notch-less display.
#[derive(Clone, Copy, serde::Serialize)]
struct NotchGeom {
    width: f64,
    height: f64,
}

/// Reposition (and optionally resize) the window. `follow` true picks the screen
/// the cursor is on (so the island follows you across displays); false keeps it on
/// the window's CURRENT screen (used by resize ticks so the morph never jumps). It
/// also emits `island://notch` so the React route fills/flanks the notch correctly.
fn place(win: &WebviewWindow, follow: bool, size: Option<NSSize>) {
    let app = win.app_handle().clone();
    with_ns_window(win, move |ns, mtm| {
        let cur = ns.frame();
        let w = size.map(|s| s.width).unwrap_or(cur.size.width);
        let h = size.map(|s| s.height).unwrap_or(cur.size.height);
        let screen = if follow {
            active_screen(mtm)
        } else {
            ns.screen().or_else(|| active_screen(mtm))
        };
        let Some(screen) = screen else {
            return;
        };
        let (notch_h, notch_w) = notch_dims(&screen);
        let f = screen.frame();
        let x = f.origin.x + f.size.width / 2.0 - w / 2.0;
        // Notched display → anchor the window TOP to the SCREEN top so the strip fills
        // the notch and merges with it. Notch-less → anchor to the menu-bar bottom
        // (visibleFrame top) so the pill hangs from the top edge.
        let top = if notch_h > 0.0 {
            f.origin.y + f.size.height
        } else {
            let vf = screen.visibleFrame();
            vf.origin.y + vf.size.height
        };
        let rect = NSRect::new(NSPoint::new(x, top - h), NSSize::new(w, h));
        // `setFrame:display:` runs `constrainFrameRect:toScreen:`, which keeps the
        // window below the menu bar and would re-clamp our notch-hugging top edge
        // downward. Set the size first, then force the exact origin with
        // `setFrameOrigin:`, which does NOT constrain — so the top can sit at the
        // screen top and merge with the notch.
        ns.setFrame_display(rect, false);
        ns.setFrameOrigin(rect.origin);
        // notch_h > 0 → notched display (strip merges with the notch); 0 → external/
        // notch-less (the pill hangs under the menu bar). If this is 0 on a notched
        // Mac, the wrong branch renders — check `safeAreaInsets().top` for that screen.
        // NB: no log here — `place` runs per morph frame (ResizeObserver), so a debug
        // line would flood. The notch geom is observable via the `island://notch` emit.
        let _ = app.emit(
            "island://notch",
            NotchGeom {
                width: notch_w,
                height: notch_h,
            },
        );
    });
}

/// Notch dimensions (px) of `screen`: `(height, width)` where height is the
/// notch / menu-bar height and width is the camera dead-zone. `(0, 0)` on a
/// notch-less display. The camera width is derived from the menu-bar areas flanking
/// the notch (`auxiliaryTop{Left,Right}Area`); if those are unavailable on a notched
/// screen, fall back to a sane estimate so content still clears the camera.
fn notch_dims(screen: &NSScreen) -> (f64, f64) {
    let height = screen.safeAreaInsets().top;
    if height <= 0.0 {
        return (0.0, 0.0);
    }
    let fw = screen.frame().size.width;
    let left = screen.auxiliaryTopLeftArea().size.width;
    let right = screen.auxiliaryTopRightArea().size.width;
    let width = fw - left - right;
    let width = if width > 0.0 && width < fw {
        width
    } else {
        200.0
    };
    (height, width)
}

/// The NSScreen whose frame contains `p` (global coords), if any.
fn screen_at(p: NSPoint, mtm: MainThreadMarker) -> Option<Retained<NSScreen>> {
    let screens = NSScreen::screens(mtm);
    for i in 0..screens.count() {
        let s = screens.objectAtIndex(i);
        let f = s.frame();
        if p.x >= f.origin.x
            && p.x <= f.origin.x + f.size.width
            && p.y >= f.origin.y
            && p.y <= f.origin.y + f.size.height
        {
            return Some(s);
        }
    }
    None
}

/// The screen to host the island: the one the cursor is on ("follow active
/// screen"), falling back to the main screen. Each display is treated on its own
/// merits — notch-hug on the built-in, top-hang on externals.
fn active_screen(mtm: MainThreadMarker) -> Option<Retained<NSScreen>> {
    screen_at(NSEvent::mouseLocation(), mtm).or_else(|| NSScreen::mainScreen(mtm))
}
