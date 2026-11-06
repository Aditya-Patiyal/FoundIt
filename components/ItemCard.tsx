import Link from "next/link";
import type { ItemCard as Item } from "@/lib/items";
import { photoPublicUrl } from "@/lib/photos";
import { timeAgo } from "@/lib/time";

// A single found-item card for the Browse grid (README §8, screen 2).
export default function ItemCard({ item }: { item: Item }) {
  const cover = item.photo_paths[0];
  const place = item.spot ? `${item.zone} · ${item.spot}` : item.zone;

  return (
    <Link
      href={`/item/${item.id}`}
      className="block overflow-hidden rounded-card bg-surface shadow-sm"
    >
      <div className="aspect-[4/3] w-full bg-black/5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- user uploads; optimization off to stay on free tier
          <img
            src={photoPublicUrl(cover)}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-muted">
            No photo
          </div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-ink">{item.title}</h3>
          <span className="shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-on-soft">
            {item.category}
          </span>
        </div>
        <p className="mt-1 line-clamp-1 text-sm text-muted">{place}</p>
        <p className="mt-0.5 text-xs text-muted">{timeAgo(item.created_at)}</p>
      </div>
    </Link>
  );
}
