import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { PostForm } from "./PostForm";

export default async function PostBikePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return <PostForm userId={user.id} />;
}
