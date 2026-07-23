import { redirect } from "next/navigation";
import { createClient } from "../../lib/supabase/server";
import { MyBikeCard, SignOutButton } from "../components";
import { BikeStatus } from "../data";

export default async function MyPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: bikeRows }] = await Promise.all([
    supabase.from("profiles").select("nickname, prefecture, favorite_genre, avatar_url").eq("id", user.id).single(),
    supabase
      .from("bikes")
      .select("id, maker, model, year, cc, style, status, is_sale, is_sold, views, custom_point")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const nickname = profile?.nickname ?? "unknown";
  const summaryLine = [profile?.prefecture, profile?.favorite_genre].filter(Boolean).join(" / ");

  const bikeIds = (bikeRows ?? []).map((b: any) => b.id);
  const { data: photoRows } = bikeIds.length > 0
    ? await supabase.from("bike_photos").select("bike_id, storage_path").in("bike_id", bikeIds).eq("sort_order", 0)
    : { data: [] as { bike_id: string; storage_path: string }[] };

  const thumbnailByBike = new Map(
    (photoRows ?? []).map((p) => [p.bike_id, supabase.storage.from("bike-photos").getPublicUrl(p.storage_path).data.publicUrl]),
  );

  const mine = (bikeRows ?? []).map((b: any) => ({
    id: b.id,
    maker: b.maker,
    model: b.model,
    year: b.year ? String(b.year) : "",
    cc: b.cc ? `${b.cc}cc` : "",
    style: b.style ?? "",
    status: b.status as BikeStatus,
    sale: b.is_sale,
    sold: b.is_sold,
    views: b.views,
    owner: nickname,
    customPoint: b.custom_point ?? "",
    thumbnailUrl: thumbnailByBike.get(b.id),
  }));

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><SignOutButton /></header>
      <section className="catalog">
        <div className="mypageHead">
          <div>
            <p className="eyebrow">MY GARAGE</p>
            <h1>マイページ</h1>
            <p className="intro">投稿したバイクの編集、写真追加、売ります設定、SOLD変更ができます。</p>
          </div>
          <a className="primary buttonLink" href="/post">＋ 新しく投稿</a>
        </div>
        <div className="profileSummary">
          <div className="avatar">{profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="realPhoto" style={{ borderRadius: "50%" }} /> : nickname.slice(0, 1).toUpperCase()}</div>
          <div><h2>{nickname}</h2><p>{summaryLine || "プロフィール未設定"}</p><a href="/profile">プロフィールを編集</a></div>
        </div>
        <h2 className="myBikesTitle">自分のバイク</h2>
        {mine.length === 0 ? (
          <p className="intro">まだ投稿がありません。</p>
        ) : (
          <div className="grid">{mine.map((b, i) => <MyBikeCard key={b.id} bike={b} index={i} thumbnailUrl={b.thumbnailUrl} />)}</div>
        )}
      </section>
    </main>
  );
}
