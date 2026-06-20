// Minimal loading state — returns null to avoid a full-page loading spinner
// that blocks the SSR content from being visible during streaming SSR.
// The server-rendered LandingServer component provides immediate visible content.
// This Suspense fallback only activates during client-side navigations.
export default function Loading() {
  return null;
}
