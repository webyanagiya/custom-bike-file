import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";
import { EditBikeForm } from "./EditBikeForm";

export default async function EditBikePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: bike, error } = await supabase
    .from("bikes")
    .select("id, owner_id, maker, model, year, cc, style, status, title, custom_point, instagram_url")
    .eq("id", id)
    .single();

  if (error || !bike || bike.owner_id !== user.id) {
    notFound();
  }

  const { data: photoRows } = await supabase
    .from("bike_photos")
    .select("id, storage_path, sort_order")
    .eq("bike_id", id)
    .order("sort_order", { ascending: true });

  const photos = (photoRows ?? []).map((p) => ({
    id: p.id,
    path: p.storage_path,
    sortOrder: p.sort_order,
    url: supabase.storage.from("bike-photos").getPublicUrl(p.storage_path).data.publicUrl,
  }));

  return <EditBikeForm bike={bike} photos={photos} userId={user.id} />;
}
