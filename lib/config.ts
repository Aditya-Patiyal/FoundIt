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

// Item categories (README §8). Stored value for an item is one of CATEGORIES.
// "All" is only a Browse filter, never a stored value.
export const CATEGORIES = [
  "Phones",
  "ID cards",
  "Wallets",
  "Keys",
  "Bags",
  "Bottles",
  "Chargers",
  "Books",
  "Other",
] as const;
export type Category = (typeof CATEGORIES)[number];
export const CATEGORY_FILTERS = ["All", ...CATEGORIES] as const;

// Zones for "where found" (README §3): hostel blocks, academic blocks, and the
// shared campus spots. Placeholders until the owner confirms real block names.
export const ZONES: string[] = [
  ...Array.from({ length: 12 }, (_, i) => `Hostel Block ${i + 1}`),
  ...Array.from({ length: 5 }, (_, i) => `Academic Block ${i + 1}`),
  "Cafeteria",
  "Library",
  "Gym",
  "Main gate",
  "Other / not sure",
];

// Where the item is now (README §5, §11 items.holding).
export const HOLDING_OPTIONS = [
  { value: "with_finder", label: "With me" },
  { value: "at_office", label: "Already handed to an office" },
] as const;
export type Holding = (typeof HOLDING_OPTIONS)[number]["value"];

// Days after posting, with the item still unclaimed and held by the finder,
// before we remind the finder to hand it to the official office (README §6, §13).
export const REMINDER_DAYS = 7;

// Which official Lost & Found office an unclaimed item should go to (README §3):
// hostel-side finds → Hostel L&F office; everything else → main gate desk.
export function officeForZone(zone: string | null | undefined): string {
  return zone && zone.startsWith("Hostel Block")
    ? "Hostel Lost & Found office"
    : "Main gate Lost & Found desk";
}

// Supabase Storage bucket for item photos (public read; see 0002 migration).
export const ITEM_PHOTOS_BUCKET = "item-photos";

// Photo limits (README §9): keep storage small and uploads fast.
export const MAX_PHOTOS_PER_ITEM = 3;
export const PHOTO_MAX_DIMENSION = 1280; // px, longest side
export const PHOTO_TARGET_BYTES = 200 * 1024; // ~200 KB target after compression
