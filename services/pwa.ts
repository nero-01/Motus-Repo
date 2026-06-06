import { Platform } from "react-native"

/**
 * Injects PWA-related <head> tags and registers the service worker.
 * Web-only. No-op on native (iOS/Android), where PWA concepts don't apply.
 *
 * This runtime approach is used because the app is configured with
 * `web.output: "single"` (SPA mode), where Expo serves a fixed HTML template
 * and does not render `app/+html.tsx`.
 */
export function setupPWA() {
  if (Platform.OS !== "web" || typeof document === "undefined") return

  const head = document.head

  const ensureTag = (selector: string, create: () => HTMLElement) => {
    if (!head.querySelector(selector)) {
      head.appendChild(create())
    }
  }

  const meta = (name: string, content: string) => {
    const el = document.createElement("meta")
    el.setAttribute("name", name)
    el.setAttribute("content", content)
    return el
  }

  const link = (rel: string, href: string, extra?: Record<string, string>) => {
    const el = document.createElement("link")
    el.setAttribute("rel", rel)
    el.setAttribute("href", href)
    if (extra) Object.entries(extra).forEach(([k, v]) => el.setAttribute(k, v))
    return el
  }

  ensureTag('link[rel="manifest"]', () => link("manifest", "/manifest.json"))
  ensureTag('meta[name="theme-color"]', () => meta("theme-color", "#00796B"))
  ensureTag('meta[name="description"]', () => meta("description", "Empowering families through meaningful activities"))
  ensureTag('link[rel="apple-touch-icon"]', () => link("apple-touch-icon", "/icons/icon-192.png"))
  ensureTag('meta[name="apple-mobile-web-app-capable"]', () => meta("apple-mobile-web-app-capable", "yes"))
  ensureTag('meta[name="mobile-web-app-capable"]', () => meta("mobile-web-app-capable", "yes"))
  ensureTag('meta[name="apple-mobile-web-app-title"]', () => meta("apple-mobile-web-app-title", "MotusTots"))
  ensureTag('meta[name="apple-mobile-web-app-status-bar-style"]', () =>
    meta("apple-mobile-web-app-status-bar-style", "default"),
  )

  if ("serviceWorker" in navigator) {
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.log("[v0] Service worker registration failed:", err)
      })
    }
    // If the page has already finished loading (common when this runs inside a
    // React effect), register immediately. Otherwise wait for the load event.
    if (document.readyState === "complete") {
      register()
    } else {
      window.addEventListener("load", register, { once: true })
    }
  }
}
