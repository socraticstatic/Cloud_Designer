import { createClient } from '@supabase/supabase-js';

// att-gate project values are public-by-design (they ship in every bundle).
// Until Task 1 of the rollout plan produces them, the PENDING defaults make
// AUTH_MODE fall back to 'gate' below, so a build without real credentials
// can never strand users behind a dead Supabase login.
//
// Do NOT set a custom storageKey: the default sb-<ref>-auth-token is shared
// across all socraticstatic.github.io apps = single sign-on across prototypes.
const SUPABASE_URL =
  (import.meta.env.VITE_ATT_GATE_URL as string | undefined) ?? 'PENDING';
const SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_ATT_GATE_KEY as string | undefined) ?? 'PENDING';

const CONFIGURED = !SUPABASE_URL.includes('PENDING');

export const AUTH_MODE: 'supabase' | 'gate' =
  (import.meta.env.VITE_AUTH_MODE as 'supabase' | 'gate' | undefined) ??
  (CONFIGURED ? 'supabase' : 'gate');

// Flash-drive/offline builds load over file: and cannot do email OTP.
// file: only — never a userAgent check: ordinary Electron-shell browsers
// (Slack/Discord webviews, the Claude browser pane) carry "Electron" in
// their UA and would silently bypass the gate on the public site.
export const IS_OFFLINE_CAPABLE = window.location.protocol === 'file:';

export const supabase = createClient(SUPABASE_URL === 'PENDING' ? 'https://pending.supabase.co' : SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
});
