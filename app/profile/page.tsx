import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("nickname, prefecture, bio, instagram, youtube, avatar_url")
    .eq("id", user.id)
    .single();

  return <ProfileForm userId={user.id} profile={profile ?? {}} />;
}
