import { notFound } from "next/navigation";
import Link from "next/link";
import { getItem } from "@/lib/items";
import { photoPublicUrl } from "@/lib/photos";
import { timeAgo } from "@/lib/time";

export default async function ItemPage({ params }: PageProps<"/item/[id]">) {
  const { id } = await params;
  const item = await getItem(id);
  if (!item) notFound();

  const place = item.spot ? `${item.zone} · ${item.spot}` : item.zone;
  const holdingLabel =
    item.holding === "with_finder" ? "Finder is holding it" : "Already at an office";

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
      <Link href="/browse" className="text-sm font-medium text-muted">
        ← Back
      </Link>

      {/* Photos */}
      <div className="mt-3 space-y-2">
        {item.photo_paths.length > 0 ? (
          item.photo_paths.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element -- user uploads; optimization off to stay on free tier
            <img
              key={p}
              src={photoPublicUrl(p)}
              alt={item.title}
              className="w-full rounded-card bg-black/5 object-cover"
            />
          ))
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center rounded-card bg-black/5 text-sm text-muted">
            No photo
          </div>
        )}
      </div>

      {/* Chips */}
      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-on-soft">
          {item.category}
        </span>
        <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-medium text-warning">
          {holdingLabel}
        </span>
      </div>

      <h1 className="mt-3 text-xl font-bold text-ink">{item.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {place} · {timeAgo(item.created_at)}
      </p>
      <p className="mt-1 text-sm text-muted">Posted by a verified MUJ student</p>

      {item.public_description ? (
        <p className="mt-4 whitespace-pre-wrap text-ink">{item.public_description}</p>
      ) : null}

      {/* How claiming works */}
      <div className="mt-5 rounded-card bg-primary-soft p-4 text-sm text-primary-on-soft">
        <p className="font-semibold">Is this yours?</p>
        <p className="mt-1">
          Tap “This is mine” and answer a few questions only the real owner would know.
          The finder checks your answers privately, then you chat and meet in a public
          place to get it back.
        </p>
      </div>

      <p className="mt-3 text-xs text-muted">
        If no one claims it within 7 days, the finder hands it to the official lost &amp;
        found office.
      </p>

      {/* This is mine — wired up in Step 3 (claims) */}
      <button
        type="button"
        disabled
        className="mt-5 w-full cursor-not-allowed rounded-btn bg-primary px-4 py-3 font-semibold text-white opacity-60"
      >
        This is mine
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        Claiming turns on in the next update.
      </p>
    </main>
  );
}
