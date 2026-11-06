"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress";
import { createClaim } from "./actions";
import { ZONES, ITEM_PHOTOS_BUCKET } from "@/lib/config";

export default function ClaimForm({
  itemId,
  itemTitle,
  userId,
}: {
  itemId: string;
  itemTitle: string;
  userId: string;
}) {
  const router = useRouter();
  const [proof, setProof] = useState<{ file: File; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError("");
    setBusy(true);

    try {
      let proofPath: string | null = null;
      if (proof) {
        const supabase = createClient();
        const blob = await compressImage(proof.file);
        proofPath = `${userId}/claim-${crypto.randomUUID()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(ITEM_PHOTOS_BUCKET)
          .upload(proofPath, blob, { contentType: "image/jpeg" });
        if (upErr) throw upErr;
      }

      const result = await createClaim({
        itemId,
        lost_zone: String(data.get("lost_zone") ?? ""),
        lost_when_text: String(data.get("lost_when_text") ?? ""),
        contents_answer: String(data.get("contents_answer") ?? ""),
        secret_answer: String(data.get("secret_answer") ?? ""),
        proof_photo_path: proofPath,
      });

      if ("error" in result) {
        setError(result.error);
        setBusy(false);
        return;
      }
      router.push(`/item/${itemId}`);
    } catch (err) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : String(err);
      setError(`Couldn't send your claim: ${msg}`);
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1.5 w-full rounded-btn border border-black/10 bg-surface px-3 py-3 text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/30";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-btn bg-primary-soft px-3 py-2 text-sm text-primary-on-soft">
        Claiming: <strong>{itemTitle}</strong>
      </div>

      <div>
        <label htmlFor="lost_zone" className="block text-sm font-medium text-ink">
          Where did you lose it?
        </label>
        <select id="lost_zone" name="lost_zone" defaultValue="" className={inputCls}>
          <option value="">Not sure</option>
          {ZONES.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lost_when_text" className="block text-sm font-medium text-ink">
          When did you lose it?
        </label>
        <input
          id="lost_when_text"
          name="lost_when_text"
          type="text"
          maxLength={200}
          placeholder="e.g. yesterday evening, around 6pm"
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="contents_answer" className="block text-sm font-medium text-ink">
          What does it look like / what&apos;s inside?
        </label>
        <textarea
          id="contents_answer"
          name="contents_answer"
          rows={3}
          maxLength={1000}
          placeholder="Describe it so the finder can match it."
          className={inputCls}
        />
        <p className="mt-1 text-xs text-warning">
          Don&apos;t type card, Aadhaar or ID numbers here.
        </p>
      </div>

      <div>
        <label htmlFor="secret_answer" className="block text-sm font-medium text-ink">
          One detail only you would know
        </label>
        <input
          id="secret_answer"
          name="secret_answer"
          type="text"
          required
          maxLength={1000}
          placeholder="e.g. phone wallpaper, a scratch, what's in the side pocket"
          className={inputCls}
        />
      </div>

      <div>
        <span className="block text-sm font-medium text-ink">
          Older photo or receipt (optional)
        </span>
        <div className="mt-2 flex items-center gap-3">
          {proof ? (
            <div className="relative h-20 w-20">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview */}
              <img
                src={proof.preview}
                alt=""
                className="h-full w-full rounded-btn object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(proof.preview);
                  setProof(null);
                }}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs text-white"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-btn border border-dashed border-black/20 text-2xl text-muted">
              +
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProof({ file, preview: URL.createObjectURL(file) });
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-btn bg-primary px-4 py-3 font-semibold text-white hover:opacity-95 disabled:opacity-60"
      >
        {busy ? "Sending…" : "Send to finder"}
      </button>

      <p className="text-center text-xs text-muted">
        Only the finder sees your answers. You can have up to 3 open claims a day.
      </p>
    </form>
  );
}
