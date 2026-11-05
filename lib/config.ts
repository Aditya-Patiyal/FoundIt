// Central app configuration.
// The app name is NOT final (README §2, §16) — keep it here in ONE place so it is
// trivial to change later. Never hard-code the name in components; import APP_NAME.

export const APP_NAME = "Wapas"; // placeholder working name

export const APP_TAGLINE = "Lost it? Found it? Get it back to its owner.";

export const APP_DESCRIPTION =
  "Campus lost & found for Manipal University Jaipur. Found something? Post it. Lost something? Claim it.";

// College email domain students must sign in with (README §2, MUJ = muj.manipal.edu).
// Kept in an env var because the domain could change / be reused on another campus.
// Exposed to the client so the sign-in screen can show the expected domain.
export const ALLOWED_EMAIL_DOMAIN =
  process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN ?? "muj.manipal.edu";

// True if an email belongs to the allowed college domain. Case-insensitive.
// This is the UI-side gate; the database trigger is the real gate (README §11).
export function isCollegeEmail(email: string): boolean {
  return email
    .trim()
    .toLowerCase()
    .endsWith("@" + ALLOWED_EMAIL_DOMAIN.toLowerCase());
}

// Hostel block options (README §3 — placeholders "Hostel Block 1 to 12" until the
// owner confirms the real names). "Day scholar" covers students not in a hostel.
export const HOSTEL_BLOCKS: string[] = [
  ...Array.from({ length: 12 }, (_, i) => `Hostel Block ${i + 1}`),
  "Day scholar (no hostel)",
];
