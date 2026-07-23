import { notFound } from "next/navigation";
import { bikeFiles, statusLabel, BikeStatus } from "../../data";
import { FavoriteButton, PhotoGallery } from "../../components";
import { createClient } from "../../../lib/supabase/server";

type OwnerInfo = { name: string; avatarUrl?: string | null; prefecture?: string | null };

type DetailBike = {
  id: string;
  maker: string;
  model: string;
  year: string;
  cc: string;
  status: BikeStatus;
  title: string;
  customPoint: string;
  instagram: string | null;
  isSale: boolean;
  isSold: boolean;
  photos: string[];
  owner: OwnerInfo;
};

export default async function BikeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const staticBike = bikeFiles.find((x) => x.id === id);
  let detail: DetailBike;

  if (staticBike) {
    detail = {
      id: staticBike.id,
      maker: staticBike.maker,
      model: staticBike.model,
      year: staticBike.year,
      cc: staticBike.cc,
      status: staticBike.status,
      title: staticBike.model,
      customPoint: staticBike.customPoint,
      instagram: null,
      isSale: staticBike.sale,
      isSold: staticBike.sold,
      photos: [],
      owner: { name: staticBike.owner },
    };
  } else {
    const supabase = await createClient();
    const { data: bike, error } = await supabase
      .from("bikes")
      .select("id, maker, model, year, cc, style, status, title, custom_point, instagram_url, is_sale, is_sold, profiles!bikes_owner_id_fkey(nickname, avatar_url, prefecture)")
      .eq("id", id)
      .single();

    if (error || !bike) {
      notFound();
    }

    const { data: photoRows } = await supabase
      .from("bike_photos")
      .select("storage_path")
      .eq("bike_id", id)
      .order("sort_order", { ascending: true });

    const photos = (photoRows ?? []).map(
      (p: any) => supabase.storage.from("bike-photos").getPublicUrl(p.storage_path).data.publicUrl,
    );

    const profile = (bike as any).profiles;

    detail = {
      id: bike.id,
      maker: bike.maker,
      model: bike.model,
      year: bike.year ? String(bike.year) : "-",
      cc: bike.cc ? `${bike.cc}cc` : "-",
      status: bike.status as BikeStatus,
      title: bike.title || bike.model,
      customPoint: bike.custom_point ?? "",
      instagram: (bike as any).instagram_url ?? null,
      isSale: bike.is_sale,
      isSold: bike.is_sold,
      photos,
      owner: { name: profile?.nickname ?? "unknown", avatarUrl: profile?.avatar_url, prefecture: profile?.prefecture },
    };
  }

  const instagramHref = detail.instagram
    ? detail.instagram.startsWith("http")
      ? detail.instagram
      : `https://instagram.com/${detail.instagram.replace(/^[@＠]/, "")}`
    : null;

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/bikes">← 一覧へ戻る</a></header>
      <article className="detailWrap">
        <div className="detailTitle">
          <div>
            <p className="eyebrow">{detail.maker}</p>
            <h1>{detail.title}</h1>
            <p>{detail.model} ／ {detail.year} ／ {detail.cc}</p>
          </div>
          <div className="detailActions">
            <span className={`statusPill ${detail.status}`}>{statusLabel[detail.status]}</span>
            <FavoriteButton id={detail.id} />
          </div>
        </div>

        <PhotoGallery photos={detail.photos} />

        <div className="detailColumns">
          <section>
            <h2>このバイクについて</h2>
            <p>{detail.customPoint || "詳しい内容はまだ登録されていません。"}</p>
            <dl>
              <div><dt>メーカー</dt><dd>{detail.maker}</dd></div>
              <div><dt>車種</dt><dd>{detail.model}</dd></div>
              <div><dt>年式</dt><dd>{detail.year}</dd></div>
              <div><dt>排気量</dt><dd>{detail.cc}</dd></div>
              {instagramHref && <div><dt>Instagram</dt><dd><a href={instagramHref} target="_blank" rel="noreferrer">{detail.instagram}</a></dd></div>}
            </dl>
          </section>
          <aside>
            <h2>投稿者</h2>
            <div className="profileSummary">
              <div className="avatar">{detail.owner.avatarUrl ? <img src={detail.owner.avatarUrl} alt="" className="realPhoto" style={{ borderRadius: "50%" }} /> : detail.owner.name.slice(0, 1).toUpperCase()}</div>
              <div><h2>{detail.owner.name}</h2>{detail.owner.prefecture && <p>{detail.owner.prefecture}</p>}</div>
            </div>
            {detail.isSale && <div className="forSaleBox"><strong>売ります</strong><p>掲載中の車両です。取引は売主と購入希望者の当事者間で行います。</p><button className="primary">オーナーへ問い合わせ</button></div>}
            {detail.isSold && <div className="soldBox">SOLD<br/><small>売却後も図鑑として掲載しています。</small></div>}
          </aside>
        </div>
      </article>
    </main>
  );
}
