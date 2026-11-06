import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getItem } from "@/lib/items";
import { getViewerItemContext } from "@/lib/claims";
import ClaimForm from "./ClaimForm";

// Screen 4 — "Prove it's yours" (the claim form).
export default async function ClaimPage({ params }: PageProps<"/item/[id]/claim">) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const item = await getItem(id);
  if (!item) notFound();

  // You can't claim your own item, and you can't claim one twice.
  const ctx = await getViewerItemContext(id);
  if (ctx.isFinder) redirect(`/item/${id}`);
  if (ctx.myClaimStatus === "pending" || ctx.myClaimStatus === "accepted") {
    redirect(`/item/${id}`);
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-4">
      <Link href={`/item/${id}`} className="text-sm font-medium text-muted">
        ← Back
      </Link>
      <h1 className="mt-3 text-xl font-bold text-ink">Prove it&apos;s yours</h1>
      <p className="mt-1 text-sm text-muted">
        Answer a few questions only the real owner would know. The finder checks them
        privately before you can chat.
      </p>
      <div className="mt-5">
        <ClaimForm itemId={id} itemTitle={item.title} userId={user.id} />
      </div>
    </main>
  );
}
