import { getItems } from "@/lib/items";
import ItemCard from "@/components/ItemCard";
import BrowseFilters from "./BrowseFilters";
import { APP_NAME } from "@/lib/config";

function first(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export default async function BrowsePage({ searchParams }: PageProps<"/browse">) {
  const sp = await searchParams;
  const q = first(sp.q);
  const category = first(sp.category) || "All";
  const zone = first(sp.zone) || "All";

  const items = await getItems({ q, category, zone });

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-10 bg-ground/90 px-4 pb-3 pt-4 backdrop-blur">
        <h1 className="text-lg font-bold text-primary-on-soft">{APP_NAME}</h1>
        <div className="mt-3">
          <BrowseFilters q={q} category={category} zone={zone} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
        {items.length === 0 ? (
          <div className="mt-10 rounded-card bg-surface p-6 text-center shadow-sm">
            <p className="font-semibold text-ink">Nothing here yet</p>
            <p className="mt-1 text-sm text-muted">
              No found items match this search. Found something? Post it so its owner can
              get it back.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
