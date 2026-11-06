import { ITEM_PHOTOS_BUCKET } from "./config";

// Public URL for an item photo stored in Supabase Storage.
// The bucket is public (README allows this in v1; no image blurring yet, §6),
// so we can build the URL directly without a client — works on server + client.
export function photoPublicUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  return `${base}/storage/v1/object/public/${ITEM_PHOTOS_BUCKET}/${path}`;
}
