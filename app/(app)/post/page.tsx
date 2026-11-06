import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostForm from "./PostForm";

// Screen 5 — Post a found item.
export default async function PostPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <h1 className="text-xl font-bold text-ink">Post a found item</h1>
      <p className="mt-1 text-sm text-muted">
        You keep the item with you. Someone who lost it can claim it here.
      </p>
      <div className="mt-5">
        <PostForm userId={user.id} />
      </div>
    </main>
  );
}
