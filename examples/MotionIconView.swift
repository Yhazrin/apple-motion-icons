// Standalone macOS adapter. Add the three JS files and HTML host to your app bundle.
import AppKit
import SwiftUI
import WebKit

enum MotionIconSubject: String {
    case lookup, lexicon, daylight, cards, book, capture, conversation, settings, sentence, memory, pencil, voice
    case sync = "refresh"
    var restPose: String {
        switch self { case .lexicon: return "saved"; case .sync: return "rest"; default: return "idle" }
    }

}

/// A decorative local renderer. Native fields/buttons retain focus and accessibility.
struct MotionIconView: NSViewRepresentable {
    var subject: MotionIconSubject
    var action: String? = nil
    var event: Int = 0
    var size: CGFloat = 28
    var playOnMount = false
    var pose: String? = nil
    var onReady: (() -> Void)? = nil
    @Environment(\.isEnabled) private var enabled
    @Environment(\.accessibilityReduceMotion) private var reduced
    @Environment(\.colorScheme) private var scheme

    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.processPool = MotionIconRuntime.processPool
        configuration.websiteDataStore = MotionIconRuntime.dataStore
        let view = DecorativeWebView(frame: .zero, configuration: configuration)
        view.underPageBackgroundColor = .clear
        view.setValue(false, forKey: "drawsBackground")
        view.navigationDelegate = context.coordinator
        context.coordinator.view = view
        view.windowChanged = { [weak coordinator = context.coordinator] window in coordinator?.observe(window) }
        if let url = Bundle.main.url(forResource: "motion-icon-host", withExtension: "html", subdirectory: "MotionIcons")
            ?? Bundle.main.url(forResource: "motion-icon-host", withExtension: "html") {
            view.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
        return view
    }

    func updateNSView(_ view: WKWebView, context: Context) {
        context.coordinator.onReady = onReady
        context.coordinator.configuration = [
            "subject": subject.rawValue, "action": action as Any? ?? NSNull(), "event": event,
            "size": Double(size), "pose": pose ?? subject.restPose, "playOnMount": playOnMount,
            "active": enabled, "reduced": reduced, "ink": scheme == .dark ? "#EFEFEF" : "#202020"
        ]
        context.coordinator.apply()
    }

    static func dismantleNSView(_ view: WKWebView, coordinator: Coordinator) {
        coordinator.detach()
        view.evaluateJavaScript("window.vordMotion?.destroy()")
        view.navigationDelegate = nil
        view.stopLoading()
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        weak var view: WKWebView?
        var configuration: [String: Any] = [:]
        var onReady: (() -> Void)?
        private var ready = false
        private var lastPayload: String?
        private var observer: NSObjectProtocol?
        private weak var window: NSWindow?
        private var visible = true

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            ready = true; lastPayload = nil; apply(); onReady?()
        }

        func observe(_ window: NSWindow?) {
            if let current = self.window, current === window { return }
            detach(); self.window = window
            visible = window?.occlusionState.contains(.visible) ?? false
            if let window {
                observer = NotificationCenter.default.addObserver(forName: NSWindow.didChangeOcclusionStateNotification,
                    object: window, queue: .main) { [weak self, weak window] _ in
                        self?.visible = window?.occlusionState.contains(.visible) ?? false
                        self?.apply()
                    }
            }
            apply()
        }

        func apply() {
            guard ready, !configuration.isEmpty else { return }
            var payload = configuration
            payload["active"] = visible && (configuration["active"] as? Bool ?? false)
            guard let data = try? JSONSerialization.data(withJSONObject: payload, options: [.sortedKeys]),
                  let json = String(data: data, encoding: .utf8), json != lastPayload else { return }
            lastPayload = json
            view?.evaluateJavaScript("window.vordMotion?.apply(\(json))")
        }

        func detach() {
            if let observer { NotificationCenter.default.removeObserver(observer) }
            observer = nil; window = nil
        }
        deinit { if let observer { NotificationCenter.default.removeObserver(observer) } }
    }
}

@MainActor
private enum MotionIconRuntime {
    // All glyph hosts share a local process pool. Resting icons do not run rAF.
    static let processPool = WKProcessPool()
    static let dataStore = WKWebsiteDataStore.nonPersistent()
}

private final class DecorativeWebView: WKWebView {
    var windowChanged: ((NSWindow?) -> Void)?
    override var acceptsFirstResponder: Bool { false }
    override func hitTest(_ point: NSPoint) -> NSView? { nil }
    override func viewDidMoveToWindow() { super.viewDidMoveToWindow(); windowChanged?(window) }
}
