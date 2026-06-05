#![deny(unsafe_op_in_unsafe_fn)]

use std::cell::Cell;
use std::collections::VecDeque;
use std::io::{Read, Write};
use std::net::{SocketAddr, TcpStream};
use std::path::{Path, PathBuf};
use std::ptr::NonNull;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use block2::RcBlock;
use objc2::rc::Retained;
use objc2::runtime::ProtocolObject;
use objc2::{define_class, msg_send, DefinedClass, MainThreadMarker, MainThreadOnly};
use objc2_app_kit::{
    NSAnimatablePropertyContainer, NSAnimationContext, NSApplication,
    NSApplicationActivationPolicy, NSAutoresizingMaskOptions, NSBackingStoreType, NSColor, NSEvent,
    NSPanel, NSScreen, NSStatusWindowLevel, NSWindowCollectionBehavior, NSWindowStyleMask,
    NSWorkspace, NSWorkspaceActiveSpaceDidChangeNotification,
};
use objc2_foundation::{
    NSActivityOptions, NSNotification, NSNumber, NSObject, NSObjectProtocol, NSPoint,
    NSProcessInfo, NSRect, NSSize, NSString, NSTimer, NSURLRequest, NSURL,
};
use objc2_web_kit::{
    WKScriptMessage, WKScriptMessageHandler, WKUserContentController, WKUserScript,
    WKUserScriptInjectionTime, WKWebView, WKWebViewConfiguration,
};
use serde::Deserialize;

const INIT_W: f64 = 460.0;
const INIT_H: f64 = 150.0;
// Core-Animation resize duration. The webview's rAF/JS clocks are suspended while the
// panel is hidden (Accessory + NonactivatingPanel), so framer-motion/CSS can't animate
// the surface — but the WINDOW SERVER still composites, so animating the panel frame via
// `panel.animator().setFrame_display` runs GPU-side and stays smooth regardless.
const ANIM_DURATION: f64 = 0.26;

#[derive(Debug, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
enum IslandMessage {
    Activity { payload: serde_json::Value },
    Present,
    Dismiss,
    Resize { width: f64, height: f64 },
}

#[derive(Debug)]
struct ScriptHandlerIvars {
    writer: Arc<Mutex<Option<TcpStream>>>,
    queue: Arc<Mutex<VecDeque<IslandMessage>>>,
}

define_class!(
    #[unsafe(super = NSObject)]
    #[thread_kind = MainThreadOnly]
    #[ivars = ScriptHandlerIvars]
    struct ScriptHandler;

    unsafe impl NSObjectProtocol for ScriptHandler {}

    unsafe impl WKScriptMessageHandler for ScriptHandler {
        #[unsafe(method(userContentController:didReceiveScriptMessage:))]
        unsafe fn user_content_controller_did_receive_script_message(
            &self,
            _user_content_controller: &WKUserContentController,
            message: &WKScriptMessage,
        ) {
            let body = unsafe { message.body() };
            let Ok(text) = body.downcast::<NSString>() else {
                return;
            };
            let Ok(value) = serde_json::from_str::<serde_json::Value>(&text.to_string()) else {
                return;
            };
            match value.get("type").and_then(|v| v.as_str()) {
                // Row click → forward to the main app over the socket (focuses the
                // session in the main window).
                Some("session_click") => {
                    let Some(session) = value.get("session_name").and_then(|v| v.as_str()) else {
                        return;
                    };
                    let line = serde_json::json!({
                        "type": "session_click",
                        "session_name": session,
                    })
                    .to_string()
                        + "\n";
                    if let Ok(mut guard) = self.ivars().writer.lock() {
                        if let Some(stream) = guard.as_mut() {
                            let _ = stream.write_all(line.as_bytes());
                        }
                    }
                },
                // Content resized → drive the native panel size locally (the route's
                // own resizeIsland IPC is a no-op in this browser-bridge webview).
                Some("resize") => {
                    let width = value.get("width").and_then(|v| v.as_f64());
                    let height = value.get("height").and_then(|v| v.as_f64());
                    if let (Some(width), Some(height)) = (width, height) {
                        if let Ok(mut queue) = self.ivars().queue.lock() {
                            queue.push_back(IslandMessage::Resize { width, height });
                        }
                    }
                },
                _ => {},
            }
        }
    }
);

impl ScriptHandler {
    fn new(
        mtm: MainThreadMarker,
        writer: Arc<Mutex<Option<TcpStream>>>,
        queue: Arc<Mutex<VecDeque<IslandMessage>>>,
    ) -> Retained<Self> {
        let this = Self::alloc(mtm).set_ivars(ScriptHandlerIvars { writer, queue });
        // SAFETY: NSObject's init has the standard Objective-C init signature.
        unsafe { msg_send![super(this), init] }
    }
}

fn main() {
    let mtm = MainThreadMarker::new().expect("island helper must start on the main thread");
    let app = NSApplication::sharedApplication(mtm);
    app.setActivationPolicy(NSApplicationActivationPolicy::Accessory);

    let port = std::env::var("CODEHUB_ISLAND_PORT")
        .ok()
        .and_then(|p| p.parse::<u16>().ok())
        .expect("CODEHUB_ISLAND_PORT must be set");
    let frontend =
        std::env::var("CODEHUB_ISLAND_FRONTEND").expect("CODEHUB_ISLAND_FRONTEND must be set");
    let parent_pid = std::env::var("CODEHUB_PARENT_PID")
        .ok()
        .and_then(|p| p.parse::<libc::pid_t>().ok());

    disable_app_nap();

    let queue = Arc::new(Mutex::new(VecDeque::new()));
    let writer = Arc::new(Mutex::new(None));
    start_tcp_reader(port, queue.clone(), writer.clone(), parent_pid);
    start_parent_watch(parent_pid);

    let panel = create_panel(mtm);
    let webview = create_webview(mtm, &frontend, writer, queue.clone());
    panel.setContentView(Some(&webview));
    place(&panel, true, None, Some(&webview));
    panel.orderFrontRegardless();

    install_space_observer(&panel, &webview);
    install_tick(&panel, &webview, queue);

    app.run();
}

define_class!(
    // NSPanel subclass that DISABLES AppKit's frame constraint. By default
    // `constrainFrameRect:toScreen:` keeps a window's top within the screen's visible area
    // (below the menu bar), which would (a) force `place()` to re-snap the origin after every
    // setFrame, and (b) make the animated resize SAG: `animator().setFrame` runs each
    // interpolated frame through the constraint, pushing the notch-pinned top down to the
    // menu bar then snapping back. Returning the rect unchanged lets the island sit at the
    // physical screen top (over the notch) AND animate there smoothly.
    #[unsafe(super = NSPanel)]
    #[thread_kind = MainThreadOnly]
    #[name = "CodehubIslandPanel"]
    struct IslandPanel;

    impl IslandPanel {
        #[unsafe(method(constrainFrameRect:toScreen:))]
        fn constrain_frame_rect_to_screen(
            &self,
            frame_rect: NSRect,
            _screen: Option<&NSScreen>,
        ) -> NSRect {
            frame_rect
        }
    }
);

fn create_panel(mtm: MainThreadMarker) -> Retained<NSPanel> {
    let rect = NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(INIT_W, INIT_H));
    let panel: Retained<IslandPanel> = unsafe {
        msg_send![
            IslandPanel::alloc(mtm),
            initWithContentRect: rect,
            styleMask: NSWindowStyleMask::Borderless | NSWindowStyleMask::NonactivatingPanel,
            backing: NSBackingStoreType::Buffered,
            defer: false,
        ]
    };
    unsafe { panel.setReleasedWhenClosed(false) };
    panel.setFloatingPanel(true);
    panel.setBecomesKeyOnlyIfNeeded(true);
    panel.setWorksWhenModal(true);
    panel.setMovable(false);
    panel.setMovableByWindowBackground(false);
    // Start click-THROUGH. The panel frame is much larger than the visible pill (it
    // carries a transparent shadow margin and sits over the menu bar / chrome tab bar
    // below it). A status-level panel that swallows clicks across its whole frame makes
    // anything beneath it (e.g. a browser tab's × button) un-clickable — the "hidden
    // layer" the user hit. The cursor poll re-enables events only while the pointer is
    // genuinely over the pill (see `hover_tick`), so the surrounding transparent area
    // always passes clicks to whatever is underneath.
    panel.setIgnoresMouseEvents(true);
    panel.setOpaque(false);
    panel.setHasShadow(false);
    panel.setBackgroundColor(Some(&NSColor::clearColor()));
    float_on_all_spaces(&panel);
    // Hand back as the base NSPanel type so the rest of the helper is unchanged (the
    // object stays a CodehubIslandPanel — the constrainFrameRect override still fires).
    panel.into_super()
}

fn create_webview(
    mtm: MainThreadMarker,
    frontend: &str,
    writer: Arc<Mutex<Option<TcpStream>>>,
    queue: Arc<Mutex<VecDeque<IslandMessage>>>,
) -> Retained<WKWebView> {
    let controller = unsafe { WKUserContentController::new(mtm) };
    let shim = NSString::from_str(ISLAND_BRIDGE_SHIM);
    let script = unsafe {
        WKUserScript::initWithSource_injectionTime_forMainFrameOnly(
            WKUserScript::alloc(mtm),
            &shim,
            WKUserScriptInjectionTime::AtDocumentStart,
            true,
        )
    };
    unsafe { controller.addUserScript(&script) };

    let handler = ScriptHandler::new(mtm, writer, queue);
    let name = NSString::from_str("codehub");
    unsafe {
        controller.addScriptMessageHandler_name(ProtocolObject::from_ref(&*handler), &name);
    }

    let config = unsafe { WKWebViewConfiguration::new(mtm) };
    unsafe { config.setUserContentController(&controller) };

    let frame = NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(INIT_W, INIT_H));
    let webview =
        unsafe { WKWebView::initWithFrame_configuration(WKWebView::alloc(mtm), frame, &config) };
    webview.setAutoresizingMask(
        NSAutoresizingMaskOptions::ViewWidthSizable | NSAutoresizingMaskOptions::ViewHeightSizable,
    );
    unsafe {
        webview.setUnderPageBackgroundColor(Some(&NSColor::clearColor()));
        webview.setAllowsMagnification(false);
        // WKWebView paints an opaque white base unless `drawsBackground` is off —
        // `setUnderPageBackgroundColor` only tints overscroll, not the page base.
        // Without this the transparent panel still shows a white card box around
        // the island pill (KVC: there is no public `setDrawsBackground:`).
        let no = NSNumber::numberWithBool(false);
        let key = NSString::from_str("drawsBackground");
        let _: () = msg_send![&*webview, setValue: &*no, forKey: &*key];
    }

    load_frontend(&webview, frontend);

    webview
}

/// Load the `#/island` route over an HTTP origin. Dev passes the live Vite URL
/// directly. A release bundle passes a filesystem path to the `dist/`
/// `index.html`; we serve that `dist/` over a loopback HTTP server and load it
/// from there — a plain `file://` load can't run the app's ES modules in
/// WKWebView (module fetch needs a real origin), which renders blank.
fn load_frontend(webview: &WKWebView, frontend: &str) {
    let raw = frontend.trim();
    if raw.is_empty() {
        return;
    }
    let url_str = if raw.starts_with("http://") || raw.starts_with("https://") {
        with_island_hash(raw)
    } else {
        let index = PathBuf::from(raw.strip_prefix("file://").unwrap_or(raw));
        let index = index.canonicalize().unwrap_or(index);
        let root = index
            .parent()
            .map(Path::to_path_buf)
            .unwrap_or_else(|| index.clone());
        match start_static_server(root) {
            Some(port) => format!("http://127.0.0.1:{port}/#/island"),
            None => return,
        }
    };
    if let Some(url) = NSURL::URLWithString(&NSString::from_str(&url_str)) {
        let request = NSURLRequest::requestWithURL(&url);
        unsafe {
            let _ = webview.loadRequest(&request);
        }
    }
}

fn with_island_hash(raw: &str) -> String {
    if raw.contains('#') {
        raw.to_string()
    } else if raw.ends_with('/') {
        format!("{raw}#/island")
    } else {
        format!("{raw}/#/island")
    }
}

/// Serve `root` (the bundled `dist/`) over a loopback HTTP server, returning its
/// port. A minimal GET-only static server — enough for the island's index.html +
/// hashed JS/CSS/font assets. The `/__bridge/*` requests never reach it (the
/// injected shim intercepts those in-page), so it only serves real files.
fn start_static_server(root: PathBuf) -> Option<u16> {
    let listener = std::net::TcpListener::bind("127.0.0.1:0").ok()?;
    let port = listener.local_addr().ok()?.port();
    thread::spawn(move || {
        for stream in listener.incoming() {
            let Ok(stream) = stream else {
                continue;
            };
            let root = root.clone();
            thread::spawn(move || serve_one(stream, &root));
        }
    });
    Some(port)
}

fn serve_one(mut stream: TcpStream, root: &Path) {
    let mut buf = [0u8; 8192];
    let n = match stream.read(&mut buf) {
        Ok(n) if n > 0 => n,
        _ => return,
    };
    let req = String::from_utf8_lossy(&buf[..n]);
    let Some(line) = req.lines().next() else {
        return;
    };
    let target = line.split_whitespace().nth(1).unwrap_or("/");
    let path = target.split(['?', '#']).next().unwrap_or("/");
    let rel = path.trim_start_matches('/');
    let rel = if rel.is_empty() { "index.html" } else { rel };
    let mut file = root.join(rel);
    if file.is_dir() {
        file = file.join("index.html");
    }
    // Resolve + confine to root (no path traversal); 404 anything outside or missing.
    let within = file
        .canonicalize()
        .ok()
        .map(|c| c.starts_with(root))
        .unwrap_or(false);
    let body = if within {
        std::fs::read(&file).ok()
    } else {
        None
    };
    match body {
        Some(body) => {
            let header = format!(
                "HTTP/1.1 200 OK\r\nContent-Type: {}\r\nContent-Length: {}\r\nCache-Control: no-cache\r\nConnection: close\r\n\r\n",
                content_type(&file),
                body.len()
            );
            let _ = stream.write_all(header.as_bytes());
            let _ = stream.write_all(&body);
        },
        None => {
            let _ = stream.write_all(
                b"HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\nConnection: close\r\n\r\n",
            );
        },
    }
}

fn content_type(path: &Path) -> &'static str {
    match path.extension().and_then(|e| e.to_str()) {
        Some("html") => "text/html; charset=utf-8",
        Some("js") | Some("mjs") => "text/javascript; charset=utf-8",
        Some("css") => "text/css; charset=utf-8",
        Some("json") | Some("map") => "application/json; charset=utf-8",
        Some("woff2") => "font/woff2",
        Some("woff") => "font/woff",
        Some("ttf") => "font/ttf",
        Some("svg") => "image/svg+xml",
        Some("png") => "image/png",
        Some("ico") => "image/x-icon",
        Some("wasm") => "application/wasm",
        _ => "application/octet-stream",
    }
}

fn start_tcp_reader(
    port: u16,
    queue: Arc<Mutex<VecDeque<IslandMessage>>>,
    writer: Arc<Mutex<Option<TcpStream>>>,
    parent_pid: Option<libc::pid_t>,
) {
    thread::spawn(move || {
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        loop {
            if !parent_alive(parent_pid) {
                std::process::exit(0);
            }
            match TcpStream::connect_timeout(&addr, Duration::from_millis(500)) {
                Ok(mut stream) => {
                    let _ = stream.set_nonblocking(true);
                    if let Ok(write_stream) = stream.try_clone() {
                        let _ = write_stream.set_nonblocking(true);
                        if let Ok(mut guard) = writer.lock() {
                            *guard = Some(write_stream);
                        }
                    }
                    read_socket(&mut stream, &queue, parent_pid);
                    if let Ok(mut guard) = writer.lock() {
                        *guard = None;
                    }
                },
                Err(_) => thread::sleep(Duration::from_millis(250)),
            }
        }
    });
}

fn read_socket(
    stream: &mut TcpStream,
    queue: &Arc<Mutex<VecDeque<IslandMessage>>>,
    parent_pid: Option<libc::pid_t>,
) {
    let mut buf = [0u8; 4096];
    let mut pending = String::new();
    loop {
        if !parent_alive(parent_pid) {
            std::process::exit(0);
        }
        match stream.read(&mut buf) {
            Ok(0) => return,
            Ok(n) => {
                pending.push_str(&String::from_utf8_lossy(&buf[..n]));
                while let Some(idx) = pending.find('\n') {
                    let line: String = pending.drain(..=idx).collect();
                    if let Ok(message) = serde_json::from_str::<IslandMessage>(line.trim()) {
                        if let Ok(mut guard) = queue.lock() {
                            guard.push_back(message);
                        }
                    }
                }
            },
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                thread::sleep(Duration::from_millis(50));
            },
            Err(e) if e.kind() == std::io::ErrorKind::Interrupted => {},
            Err(_) => return,
        }
    }
}

fn start_parent_watch(parent_pid: Option<libc::pid_t>) {
    thread::spawn(move || loop {
        thread::sleep(Duration::from_secs(1));
        if !parent_alive(parent_pid) {
            std::process::exit(0);
        }
    });
}

fn parent_alive(parent_pid: Option<libc::pid_t>) -> bool {
    let Some(pid) = parent_pid else {
        return true;
    };
    if pid <= 0 {
        return true;
    }
    let rc = unsafe { libc::kill(pid, 0) };
    if rc == 0 {
        return true;
    }
    std::io::Error::last_os_error().raw_os_error() == Some(libc::EPERM)
}

fn install_tick(
    panel: &Retained<NSPanel>,
    webview: &Retained<WKWebView>,
    queue: Arc<Mutex<VecDeque<IslandMessage>>>,
) {
    let panel = panel.clone();
    let webview = webview.clone();
    // Per-tick dedupe state: the 20Hz tick used to fire `island://hover` +
    // `island://cursor` evaluateJavaScript EVERY tick, and `place()` re-emitted
    // `island://notch` on every (jittery) resize — a constant evaluateJavaScript +
    // setFrame storm that lagged the webview and thrashed hit-testing. Now hover is
    // emitted only when it flips (with a periodic resync — see `hover_tick`), and
    // the cursor only when it actually moves.
    let last_hover: Cell<Option<bool>> = Cell::new(None);
    let last_cursor: Cell<(i32, i32)> = Cell::new((i32::MIN, i32::MIN));
    // Tracks the current `ignoresMouseEvents` value so it flips only on change (it gates
    // click-through over the pill — see `hover_tick`).
    let last_ignore: Cell<Option<bool>> = Cell::new(None);
    let ticks: Cell<u64> = Cell::new(0);
    let block = RcBlock::new(move |_t: NonNull<NSTimer>| {
        let n = ticks.get();
        ticks.set(n.wrapping_add(1));
        // Force a hover resync every ~0.5s so a single dropped emit can never latch
        // the island (a desync would otherwise freeze hover-expand permanently now
        // that we no longer re-send every tick).
        let resync = n % 10 == 0;
        process_messages(&panel, &webview, &queue);
        hover_tick(
            &panel,
            &webview,
            &last_hover,
            &last_cursor,
            &last_ignore,
            resync,
        );
        // Re-emit notch dims ~2Hz so a startup emit the React listener missed (it
        // attaches asynchronously, AFTER place()'s one-shot emit) self-heals — else
        // React stays notch-less and renders a narrow pill centered UNDER the physical
        // notch (invisible). The route dedupes by value, so a steady notch costs no
        // re-render; the per-resize emit that caused the shake is still suppressed by
        // LAST_NOTCH in place(). This is a separate low-rate heartbeat.
        if resync {
            emit_notch(&panel, &webview);
        }
    });
    let timer =
        unsafe { NSTimer::scheduledTimerWithTimeInterval_repeats_block(0.05, true, &block) };
    std::mem::forget(timer);
}

fn process_messages(
    panel: &NSPanel,
    webview: &WKWebView,
    queue: &Arc<Mutex<VecDeque<IslandMessage>>>,
) {
    let messages = {
        let Ok(mut guard) = queue.lock() else {
            return;
        };
        guard.drain(..).collect::<Vec<_>>()
    };
    for message in messages {
        match message {
            IslandMessage::Activity { payload } => set_activity(webview, payload),
            IslandMessage::Present => {
                float_on_all_spaces(panel);
                place(panel, true, None, Some(webview));
                panel.orderFrontRegardless();
            },
            IslandMessage::Dismiss => panel.orderOut(None),
            IslandMessage::Resize { width, height } => {
                resize_panel(panel, webview, width, height);
            },
        }
    }
}

fn set_activity(webview: &WKWebView, payload: serde_json::Value) {
    let js = format!(
        "window.__CODEHUB_ISLAND_SET_ACTIVITY && window.__CODEHUB_ISLAND_SET_ACTIVITY({});",
        payload
    );
    eval(webview, &js);
}

fn eval(webview: &WKWebView, js: &str) {
    let script = NSString::from_str(js);
    unsafe {
        webview.evaluateJavaScript_completionHandler(&script, None);
    }
}

fn emit(webview: &WKWebView, event: &str, payload: serde_json::Value) {
    let js = format!(
        "window.__CODEHUB_ISLAND_EMIT && window.__CODEHUB_ISLAND_EMIT({}, {});",
        serde_json::to_string(event).unwrap_or_else(|_| "\"\"".into()),
        payload
    );
    eval(webview, &js);
}

fn install_space_observer(panel: &Retained<NSPanel>, webview: &Retained<WKWebView>) {
    let panel = panel.clone();
    let webview = webview.clone();
    let block = RcBlock::new(move |_n: NonNull<NSNotification>| {
        if !panel.isVisible() {
            return;
        }
        float_on_all_spaces(&panel);
        place(&panel, true, None, Some(&webview));
        panel.orderFrontRegardless();
    });
    let center = NSWorkspace::sharedWorkspace().notificationCenter();
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

fn disable_app_nap() {
    let pi = NSProcessInfo::processInfo();
    let reason = NSString::from_str("CodeHub Island helper stays live over full-screen Spaces");
    let token = pi.beginActivityWithOptions_reason(
        NSActivityOptions::UserInitiatedAllowingIdleSystemSleep,
        &reason,
    );
    std::mem::forget(token);
}

thread_local! {
    /// Last size REQUESTED via a content `Resize` — skip a redundant retarget (the
    /// frontend posts its per-mode target once per expand/collapse/minimize, but the
    /// shim's safety-net interval re-posts the same target; a no-op would needlessly
    /// restart the animation).
    static LAST_RESIZE: Cell<(i64, i64)> = const { Cell::new((i64::MIN, i64::MIN)) };
    /// Last `island://notch` dims emitted — only re-emit when they actually change, so
    /// a resize never triggers a per-frame `setNotch` re-render in the React island.
    static LAST_NOTCH: Cell<(i64, i64)> = const { Cell::new((i64::MIN, i64::MIN)) };
}

fn resize_panel(panel: &NSPanel, _webview: &WKWebView, width: f64, height: f64) {
    let w = width.max(160.0);
    let h = height.max(48.0);
    let key = (w.round() as i64, h.round() as i64);
    // Drop a resize that wouldn't change the target (idempotent — the shim re-posts the
    // same target on its safety interval). Otherwise animate the frame to it.
    if LAST_RESIZE.with(|c| c.replace(key)) == key {
        return;
    }
    animate_resize(panel, w, h);
}

/// Top-pinned, horizontally-CENTERED target rect for a `w×h` island on `screen` (same
/// geometry as `place()`). Centering x is what makes a resize symmetric — the pill grows
/// and shrinks equally on both sides (the minimize "reduces width from left and right
/// equally"). On a notched screen the top is the physical screen top (over the notch);
/// otherwise the visible-frame top (under the menu bar).
fn target_rect(screen: &NSScreen, w: f64, h: f64) -> NSRect {
    let (notch_h, _notch_w) = notch_dims(screen);
    let f = screen.frame();
    let vf = screen.visibleFrame();
    let x = f.origin.x + f.size.width / 2.0 - w / 2.0;
    let top = if notch_h > 0.0 {
        f.origin.y + f.size.height
    } else {
        vf.origin.y + vf.size.height
    };
    NSRect::new(NSPoint::new(x, top - h), NSSize::new(w, h))
}

/// Smoothly animate the panel frame to `w×h` (Core Animation, GPU/window-server-side, so
/// it's smooth even though the helper webview's rAF is suspended — only JS animation clocks
/// are gated, not AppKit's). Uses the window's `animator()` proxy inside an
/// `NSAnimationContext` group instead of a per-tick lerp (which was 20fps + janky). The
/// webview is the contentView with width+height autoresizing, so it tracks the animating
/// frame for free (its CSS is width:100%). `animator().setFrame` interpolates origin.y and
/// height linearly and the endpoints are both top-pinned + centered, so EVERY intermediate
/// frame stays pinned + centered → no sag, symmetric. `IslandPanel` disables the frame
/// constraint so the notch-pinned top isn't clamped mid-animation. While hidden/occluded,
/// snap instantly (no point easing off-screen). Re-calling mid-animation rebases cleanly
/// to the new target.
fn animate_resize(panel: &NSPanel, w: f64, h: f64) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let Some(screen) = panel.screen().or_else(|| active_screen(mtm)) else {
        return;
    };
    let rect = target_rect(&screen, w, h);
    if !panel.isVisible() {
        place(panel, false, Some(rect.size), None);
        return;
    }
    NSAnimationContext::beginGrouping();
    NSAnimationContext::currentContext().setDuration(ANIM_DURATION);
    panel.animator().setFrame_display(rect, true);
    NSAnimationContext::endGrouping();
    log_island("resize", &screen, rect);
}

/// Append one settled-geometry line to `/tmp/codehub-island.log` (on-device diagnostic —
/// the panel has no devtools). `tag` is the call site (`place`/`resize`); `rect` is the
/// committed window frame. Only end-state frames are logged (the animator interpolates
/// in-between frames window-server-side and never re-enters here), so this never floods.
fn log_island(tag: &str, screen: &NSScreen, rect: NSRect) {
    let (notch_h, notch_w) = notch_dims(screen);
    let f = screen.frame();
    let vf = screen.visibleFrame();
    if let Ok(mut log) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open("/tmp/codehub-island.log")
    {
        let _ = writeln!(
            log,
            "{} screen_frame=({:.1},{:.1},{:.1},{:.1}) screen_visible_frame=({:.1},{:.1},{:.1},{:.1}) notch=(height:{:.1},width:{:.1}) notched={} window_rect=({:.1},{:.1},{:.1},{:.1})",
            tag,
            f.origin.x,
            f.origin.y,
            f.size.width,
            f.size.height,
            vf.origin.x,
            vf.origin.y,
            vf.size.width,
            vf.size.height,
            notch_h,
            notch_w,
            notch_h > 0.0,
            rect.origin.x,
            rect.origin.y,
            rect.size.width,
            rect.size.height
        );
    }
}

fn hover_tick(
    panel: &NSPanel,
    webview: &WKWebView,
    last_hover: &Cell<Option<bool>>,
    last_cursor: &Cell<(i32, i32)>,
    last_ignore: &Cell<Option<bool>>,
    resync: bool,
) {
    // Push `island://hover` when the value flips, OR on the periodic resync tick so
    // a single dropped emit can't latch the island (emitting it 20×/s drowned the
    // webview in evaluateJavaScript + React renders; the ~2Hz resync costs nothing).
    let set_hover = |webview: &WKWebView, v: bool| {
        if last_hover.get() != Some(v) || resync {
            last_hover.set(Some(v));
            emit(webview, "island://hover", serde_json::Value::Bool(v));
        }
    };
    // Gate click-through: events pass to whatever is under the panel UNLESS the cursor is
    // genuinely over the pill. `ignore == !inside`, flipped only on change. Computed from
    // the same global cursor poll as hover, so it works even while the panel ignores
    // events (the poll reads NSEvent::mouseLocation, not window events).
    let set_ignore = |panel: &NSPanel, ignore: bool| {
        if last_ignore.get() != Some(ignore) {
            last_ignore.set(Some(ignore));
            panel.setIgnoresMouseEvents(ignore);
        }
    };
    if !panel.isVisible() {
        set_hover(webview, false);
        set_ignore(panel, true);
        return;
    }
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let p = NSEvent::mouseLocation();
    let f = panel.frame();
    let center = NSPoint::new(
        f.origin.x + f.size.width / 2.0,
        f.origin.y + f.size.height / 2.0,
    );
    let have = screen_at(center, mtm).or_else(|| panel.screen());
    let want = screen_at(p, mtm);
    if let (Some(have), Some(want)) = (have, want) {
        let (a, b) = (have.frame().origin, want.frame().origin);
        if a.x != b.x || a.y != b.y {
            place(panel, true, None, Some(webview));
            return;
        }
    }
    // The panel frame is larger than the VISIBLE black pill: the React card carries a
    // 1.5rem (=24px, root pinned to 16px) transparent margin on its sides + bottom so
    // the pill's drop shadow isn't clipped by the window edge. Hit-test the pill, NOT
    // that shadow halo — otherwise the island expands while the cursor is still over
    // the empty transparent margin ("expands although the mouse isn't on it"). Top is
    // flush with the notch (no top padding), so only inset left/right/bottom.
    let halo = 24.0;
    let inside = p.x >= f.origin.x + halo
        && p.x <= f.origin.x + f.size.width - halo
        && p.y >= f.origin.y + halo
        && p.y <= f.origin.y + f.size.height;
    set_hover(webview, inside);
    set_ignore(panel, !inside);
    if inside {
        let lx = (p.x - f.origin.x).round() as i32;
        let ly = ((f.origin.y + f.size.height) - p.y).round() as i32;
        // …and the cursor only when the pointer moved enough to plausibly cross a
        // row (≥4px), or on the resync tick. Per-pixel emits fired a setCursorSession
        // re-render up to 20×/s that competed with the morph animation on the
        // (background-throttled) webview — row hit-testing doesn't need that grain.
        let (px, py) = last_cursor.get();
        if resync || (lx - px).abs() >= 4 || (ly - py).abs() >= 4 {
            last_cursor.set((lx, ly));
            emit(
                webview,
                "island://cursor",
                serde_json::json!({ "x": lx, "y": ly }),
            );
        }
    }
}

fn float_on_all_spaces(panel: &NSPanel) {
    panel.setLevel(NSStatusWindowLevel);
    panel.setCollectionBehavior(
        NSWindowCollectionBehavior::CanJoinAllSpaces
            | NSWindowCollectionBehavior::Stationary
            | NSWindowCollectionBehavior::FullScreenAuxiliary,
    );
}

fn place(panel: &NSPanel, follow: bool, size: Option<NSSize>, webview: Option<&WKWebView>) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let cur = panel.frame();
    let w = size.map(|s| s.width).unwrap_or(cur.size.width);
    let h = size.map(|s| s.height).unwrap_or(cur.size.height);
    let screen = if follow {
        active_screen(mtm)
    } else {
        panel.screen().or_else(|| active_screen(mtm))
    };
    let Some(screen) = screen else {
        return;
    };
    let (notch_h, notch_w) = notch_dims(&screen);
    let f = screen.frame();
    let vf = screen.visibleFrame();
    let safe_top = screen.safeAreaInsets().top;
    let aux_left_w = screen.auxiliaryTopLeftArea().size.width;
    let aux_right_w = screen.auxiliaryTopRightArea().size.width;
    let notched = notch_h > 0.0;
    let x = f.origin.x + f.size.width / 2.0 - w / 2.0;
    let top = if notched {
        f.origin.y + f.size.height
    } else {
        vf.origin.y + vf.size.height
    };
    let rect = NSRect::new(NSPoint::new(x, top - h), NSSize::new(w, h));
    panel.setFrame_display(rect, false);
    panel.setFrameOrigin(rect.origin);
    let _ = (safe_top, aux_left_w, aux_right_w);
    log_island("place", &screen, rect);
    if let Some(webview) = webview {
        webview.setFrame(NSRect::new(NSPoint::new(0.0, 0.0), NSSize::new(w, h)));
        // Only push notch dims when they actually change (screen/notch switch) — a
        // resize re-running place() must NOT re-emit unchanged dims, or the React island
        // does a `setNotch` re-render mid-morph (the old per-resize emit = the shake).
        let nk = (notch_w.round() as i64, notch_h.round() as i64);
        if LAST_NOTCH.with(|c| c.replace(nk)) != nk {
            emit(
                webview,
                "island://notch",
                serde_json::json!({ "width": notch_w, "height": notch_h }),
            );
        }
    }
}

fn notch_dims(screen: &NSScreen) -> (f64, f64) {
    let frame = screen.frame();
    let visible = screen.visibleFrame();
    let safe_top = screen.safeAreaInsets().top;
    let frame_w = frame.size.width;
    let left_w = screen.auxiliaryTopLeftArea().size.width;
    let right_w = screen.auxiliaryTopRightArea().size.width;
    let aux_gap_w = frame_w - left_w - right_w;
    let has_aux_gap = left_w > 0.0 && right_w > 0.0 && aux_gap_w > 0.0 && aux_gap_w < frame_w;
    let notched = safe_top > 0.0 || has_aux_gap;
    if !notched {
        return (0.0, 0.0);
    }

    let height = if safe_top > 0.0 {
        safe_top
    } else {
        let fallback = frame.size.height - visible.size.height - visible.origin.y;
        if fallback > 0.0 {
            fallback
        } else {
            37.0
        }
    };
    let width = if has_aux_gap { aux_gap_w } else { 200.0 };
    (height, width)
}

/// Low-rate notch heartbeat (~2Hz from the tick): recompute the current screen's notch
/// dims and emit `island://notch` so a React listener that missed place()'s one-shot
/// startup emit still converges. The route dedupes by value, so a steady notch is a
/// no-op there. LAST_NOTCH is left untouched (place() still gates its own emit on real
/// changes); the value-dedupe on the React side absorbs any overlap.
fn emit_notch(panel: &NSPanel, webview: &WKWebView) {
    let Some(mtm) = MainThreadMarker::new() else {
        return;
    };
    let Some(screen) = panel.screen().or_else(|| active_screen(mtm)) else {
        return;
    };
    let (notch_h, notch_w) = notch_dims(&screen);
    emit(
        webview,
        "island://notch",
        serde_json::json!({ "width": notch_w, "height": notch_h }),
    );
}

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

fn active_screen(mtm: MainThreadMarker) -> Option<Retained<NSScreen>> {
    screen_at(NSEvent::mouseLocation(), mtm).or_else(|| NSScreen::mainScreen(mtm))
}

const ISLAND_BRIDGE_SHIM: &str = r#"
(() => {
  // Mark this webview as the NATIVE island host (not a dev browser). The route uses
  // this to trust the authoritative native cursor poll (island://hover) and IGNORE
  // the in-webview DOM hover, which never gets a mouseleave while CodeHub is not the
  // active app — so without this the island sticks expanded after the cursor leaves.
  window.__CODEHUB_ISLAND_NATIVE = true;
  const state = { activity: [], prompts: [], sessions: [] };
  const sockets = [];
  const nativeFetch = window.fetch ? window.fetch.bind(window) : null;
  const NativeWebSocket = window.WebSocket;

  function response(data) {
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  function sessionsFromActivity(activity) {
    return activity.map((a) => ({
      name: a.session,
      windows: 1,
      attached: false,
      created: 0,
      workspace: a.workspace || "",
    }));
  }

  window.__CODEHUB_ISLAND_SET_ACTIVITY = (payload) => {
    if (Array.isArray(payload)) {
      state.activity = payload;
      state.prompts = [];
      state.sessions = sessionsFromActivity(payload);
    } else {
      state.activity = payload.activity || [];
      state.prompts = payload.prompts || [];
      state.sessions = payload.sessions || sessionsFromActivity(state.activity);
    }
  };

  window.__CODEHUB_ISLAND_EMIT = (event, payload) => {
    const data = JSON.stringify({ event, payload });
    for (const ws of sockets.slice()) {
      const frame = { data };
      if (typeof ws.onmessage === "function") ws.onmessage(frame);
      const listeners = ws.__listeners && ws.__listeners.message;
      if (listeners) for (const cb of listeners.slice()) cb(frame);
    }
  };

  window.fetch = (input, init) => {
    const raw = typeof input === "string" ? input : input && input.url;
    const path = new URL(raw || "", "http://codehub.local").pathname;
    if (path === "/__bridge/session-activity") return Promise.resolve(response(state.activity));
    if (path === "/__bridge/pending-prompts") return Promise.resolve(response(state.prompts));
    if (path === "/__bridge/sessions") return Promise.resolve(response(state.sessions));
    if (path.startsWith("/__bridge/")) return Promise.resolve(response(null));
    return nativeFetch ? nativeFetch(input, init) : Promise.reject(new Error("fetch unavailable"));
  };

  window.WebSocket = function CodeHubIslandWebSocket(url, protocols) {
    if (String(url).includes("/__bridge/events")) {
      const ws = {
        readyState: 1,
        url: String(url),
        protocol: "",
        __listeners: {},
        send() {},
        close() {
          this.readyState = 3;
          if (typeof this.onclose === "function") this.onclose({ code: 1000, reason: "" });
        },
        addEventListener(type, cb) {
          (this.__listeners[type] ||= []).push(cb);
        },
        removeEventListener(type, cb) {
          this.__listeners[type] = (this.__listeners[type] || []).filter((x) => x !== cb);
        },
      };
      sockets.push(ws);
      setTimeout(() => {
        if (typeof ws.onopen === "function") ws.onopen({});
      }, 0);
      return ws;
    }
    return new NativeWebSocket(url, protocols);
  };
  Object.assign(window.WebSocket, NativeWebSocket || {}, {
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3,
  });

  function postNative(payload) {
    if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.codehub) {
      window.webkit.messageHandlers.codehub.postMessage(JSON.stringify(payload));
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target && event.target.closest && event.target.closest("[data-island-row]");
    const session = target && target.getAttribute("data-island-row");
    if (!session) return;
    postNative({ type: "session_click", session_name: session });
  }, true);

  // The route's resizeIsland() IPC is a no-op in this browser-bridge webview, so the
  // route exposes the final window targets as data attributes on data-island-card — one
  // per resting MODE (expanded / collapsed / peek), plus the current mode in
  // data-island-mode. We post the current mode's target to the native panel.
  //
  // CRITICAL: this helper's WKWebView runs in an Accessory-app, borderless,
  // non-activating panel, which WebKit treats as document.visibilityState="hidden" — so
  // requestAnimationFrame is SUSPENDED (it fires one burst at documentStart, before React
  // mounts the card, then never again) and timers are throttled to ~1s. A rAF measure loop
  // therefore NEVER sees the card and never resizes (the window stays frozen at its init
  // size). So drive resizes WITHOUT rAF: a MutationObserver on the card's attributes fires
  // instantly on every mode change (mutation callbacks run even while hidden), with a
  // low-frequency setInterval as a safety net + initial catch. The surface itself snaps
  // (no spring) on the React side, so window + content stay in lockstep — no settle delay.
  let lastW = 0, lastH = 0;
  let observed = null;
  let attrObserver = null;

  function numberAttr(card, name) {
    const value = Number(card.getAttribute(name));
    return Number.isFinite(value) && value > 0 ? Math.ceil(value) : 0;
  }

  function modeOf(card) {
    return card.getAttribute("data-island-mode") || "collapsed";
  }

  function targetForMode(card, mode) {
    const w = numberAttr(card, `data-island-${mode}-w`);
    const h = numberAttr(card, `data-island-${mode}-h`);
    return w > 0 && h > 0 ? { w, h } : null;
  }

  function measuredTarget(card) {
    const r = card.getBoundingClientRect();
    const w = Math.ceil(r.width), h = Math.ceil(r.height);
    return w > 0 && h > 0 ? { w, h } : null;
  }

  function postResize(target) {
    if (!target) return;
    const { w, h } = target;
    if (w !== lastW || h !== lastH) {
      lastW = w; lastH = h;
      postNative({ type: "resize", width: w, height: h });
    }
  }

  // Re-read the card's mode and size the window to it. Idempotent (postResize dedups by
  // w/h), so it's safe to call from both the observer and the interval as often as they
  // fire. The attr observer is (re)attached here so it survives a card remount.
  const ATTRS = ["data-island-mode", "data-island-expanded-w", "data-island-expanded-h",
    "data-island-collapsed-w", "data-island-collapsed-h", "data-island-peek-w", "data-island-peek-h"];
  function update() {
    const card = document.querySelector("[data-island-card]");
    if (!card) return;
    if (card !== observed) {
      observed = card;
      if (attrObserver) attrObserver.disconnect();
      attrObserver = new MutationObserver(update);
      attrObserver.observe(card, { attributes: true, attributeFilter: ATTRS });
    }
    postResize(targetForMode(card, modeOf(card)) || measuredTarget(card));
  }

  // The card doesn't exist at documentStart — watch the tree until React mounts it (one
  // shot, then disconnect), so the initial size lands immediately rather than on the next
  // interval tick.
  const rootObserver = new MutationObserver(() => {
    if (document.querySelector("[data-island-card]")) { rootObserver.disconnect(); update(); }
  });
  rootObserver.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(update, 500);
  update();
})();
"#;
