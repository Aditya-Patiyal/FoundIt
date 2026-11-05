// Central app configuration.
// The app name is NOT final (README §2, §16) — keep it here in ONE place so it is
// trivial to change later. Never hard-code the name in components; import APP_NAME.

export const APP_NAME = "Wapas"; // placeholder working name

export const APP_TAGLINE = "Lost it? Found it? Get it back to its owner.";

export const APP_DESCRIPTION =
  "Campus lost & found for Manipal University Jaipur. Found something? Post it. Lost something? Claim it.";

// College email domain students must sign in with (README §2).
// Kept in an env var because the real domain is still an open question (§16).
// Exposed to the client so the sign-in screen can show the expected domain.
export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "[college email domain]";
