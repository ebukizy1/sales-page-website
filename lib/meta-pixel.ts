/**
 * Utility functions for tracking Meta (Facebook) Pixel events.
 */

export function trackMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq as undefined | ((...args: any[]) => void);
    if (fbq) {
      if (params) {
        fbq("track", eventName, params);
      } else {
        fbq("track", eventName);
      }
    }
  }
}

export function trackCustomMetaEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq as undefined | ((...args: any[]) => void);
    if (fbq) {
      if (params) {
        fbq("trackCustom", eventName, params);
      } else {
        fbq("trackCustom", eventName);
      }
    }
  }
}
