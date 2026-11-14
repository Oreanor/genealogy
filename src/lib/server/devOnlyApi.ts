import { NextResponse } from 'next/server';

/**
 * Admin helper endpoints (photo scan, geocoding proxy) are meant for local
 * editing only. In production they are disabled unless explicitly enabled,
 * so the public deployment doesn't expose a file listing or an open proxy.
 */
export function isDevOnlyApiEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.ENABLE_ADMIN_API === 'true';
}

/** Returns a 404 response when dev-only APIs are disabled, otherwise `null`. */
export function rejectIfDevOnlyApiDisabled(): NextResponse | null {
  return isDevOnlyApiEnabled() ? null : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
