/**
 * LIFF wrapper utilities.
 *
 * WARNING: @line/liff depends on browser APIs (window, document, etc.).
 * All functions in this file MUST only be called from Client Components
 * (files that have 'use client' at the top) or inside useEffect/event handlers.
 * Never import or call these from Server Components or API routes.
 */

import liff from '@line/liff';

let _initialized = false;

/**
 * Initialise the LIFF SDK.
 * Safe to call multiple times — subsequent calls are no-ops.
 * Throws if NEXT_PUBLIC_LIFF_ID is not set.
 */
export async function initLiff(): Promise<void> {
  if (_initialized) return;

  const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
  if (!liffId) {
    throw new Error('NEXT_PUBLIC_LIFF_ID is not set');
  }

  await liff.init({ liffId });
  _initialized = true;
}

/**
 * Returns the current user's LINE profile.
 * Throws if the user is not logged in.
 */
export async function getLiffProfile(): Promise<{
  userId: string;
  displayName: string;
  pictureUrl: string;
}> {
  const profile = await liff.getProfile();
  return {
    userId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl ?? '',
  };
}

/**
 * Returns the LIFF ID token (JWT issued by LINE), or null if unavailable.
 */
export function getLiffIdToken(): string | null {
  return liff.getIDToken();
}

export { liff };
