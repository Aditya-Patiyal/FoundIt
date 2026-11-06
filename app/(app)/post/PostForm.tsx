"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress";
import { createItem } from "./actions";
import {
  CATEGORIES,
  ZONES,
  HOLDING_OPTIONS,
  MAX_PHOTOS_PER_ITEM,
  ITEM_PHOTOS_BUCKET,
} from "@/lib/config";

type Selected = { file: File; preview: string };

export default function PostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [photos, setPhotos] = useState<Selected[]>([]);
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [holding, setHolding] = useState<string>(HOLDING_OPTIONS[0].value);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function addFiles(list: FileList | null) {
    if (!list) return;
    const room = MAX_PHOTOS_PER_ITEM - photos.length;
    const next = Array.from(list)
      .slice(0, room)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((p) => [...p, ...next]);
  }

  function removePhoto(i: number) {
    setPhotos((p) => {
      URL.revokeObjectURL(p[i].preview);
      return p.filter((_, idx) => idx !== i);
    });
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (photos.length === 0) {
      setError("Please add at least one photo.");
      return;
    }
    setBusy(true);

    try {
      const supabase = createClient();
      const paths: string[] = [];
      for (const { file } of photos) {
        const blob = await compressImage(file);
        const path = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(ITEM_PHOTOS_BUCKET)
          .upload(path, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
        paths.push(path);
      }

      const form = e.currentTarget;
      const data = new FormData(form);
      const result = await createItem({
        title: String(data.get("title") ?? ""),
        category,
        public_description: String(data.get("public_description") ?? ""),
        zone: String(data.get("zone") ?? ""),
        spot: String(data.get("spot") ?? ""),
        holding,
        private_details: String(data.get("private_details") ?? ""),
        photo_paths: paths,
      });
      if ("error" in result) {
        setError(result.error);
        setBusy(false);
        return;
      }
      router.push(`/item/${result.id}`);
    } catch (err) {
      // Temporary: surface the real reason so we can diagnose upload failures.
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      console.error("Post failed:", err);
      setError(`Upload failed: ${msg}`);
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-btn border border-black/10 bg-surface px-3 py-3 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-ink">
          Photos (up to {MAX_PHOTOS_PER_ITEM})
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img
                src={p.preview}
                alt=""
                className="h-full w-full rounded-btn object-cover"
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS_PER_ITEM && (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-btn border border-dashed border-black/20 text-2xl text-muted">
              +
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <span className="block text-sm font-medium text-ink">Category</span>
        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
                category === c
                  ? "bg-primary text-white"
                  : "bg-surface text-muted ring-1 ring-black/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-ink">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          maxLength={120}
          placeholder="e.g. Black wallet, blue water bottle"
          className={inputCls}
        />
      </div>

      {/* Public description */}
      <div>
        <label
          htmlFor="public_description"
          className="block text-sm font-medium text-ink"
        >
          Public description
        </label>
        <textarea
          id="public_description"
          name="public_description"
          rows={3}
          maxLength={2000}
          placeholder="What it looks like, where you found it. Don't give away private details here."
          className={inputCls}
        />
      </div>

      {/* Where found */}
      <div>
        <label htmlFor="zone" className="block text-sm font-medium text-ink">
          Where did you find it?
        </label>
        <select id="zone" name="zone" required defaultValue="" className={inputCls}>
          <option value="" disabled>
            Select a location
          </option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <input
          name="spot"
          type="text"
          maxLength={120}
          placeholder="Exact spot (optional) — e.g. near the library entrance"
          className={inputCls}
        />
      </div>

      {/* Where is it now */}
      <div>
        <span className="block text-sm font-medium text-ink">Where is it now?</span>
        <div className="mt-2 space-y-2">
          {HOLDING_OPTIONS.map((h) => (
            <label
              key={h.value}
              className="flex items-center gap-3 rounded-btn border border-black/10 bg-surface px-3 py-3 text-sm text-ink"
            >
              <input
                type="radio"
                name="holding"
                value={h.value}
                checked={holding === h.value}
                onChange={() => setHolding(h.value)}
              />
              {h.label}
            </label>
          ))}
        </div>
      </div>

      {/* Private details */}
      <div>
        <label htmlFor="private_details" className="block text-sm font-medium text-ink">
          Private details (only you can see this)
        </label>
        <textarea
          id="private_details"
          name="private_details"
          rows={3}
          maxLength={2000}
          placeholder="A detail only the real owner would know — phone wallpaper, what's inside, a sticker. Used to check claims."
          className={inputCls}
        />
        <p className="mt-1 text-xs text-muted">
          Never shown to anyone else. It's how you'll tell the real owner from a guesser.
        </p>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white hover:opacity-95 disabled:opacity-60"
      >
        {busy ? "Posting…" : "Post item"}
      </button>

      <p className="text-center text-xs text-muted">
        If no one claims it within 7 days, you'll be reminded to hand it to the official
        lost &amp; found office.
      </p>
    </form>
  );
}
