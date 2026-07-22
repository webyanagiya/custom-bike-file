import { notFound } from "next/navigation";
import { bikeFiles, statusLabel, BikeStatus } from "../../data";
import { FavoriteButton, Gallery, PhotoGallery } from "../../components";
import { createClient } from "../../../lib/supabase/server";

export default async function BikeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const b = bikeFiles.find((x) => x.id === id);
  if (b) {
    return <main className="subPage"><header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/bikes">← 一覧へ戻る</a></header><article className="detailWrap"><div className="detailTitle"><div><p className="eyebrow">{b.maker}</p><h1>{b.model}</h1><p>{b.year} / {b.cc} / {b.style}</p></div><div className="detailActions"><span className={`statusPill ${b.status}`}>{statusLabel[b.status]}</span><FavoriteButton id={b.id}/></div></div><Gallery/><div className="detailColumns"><section><h2>このバイクについて</h2><p>{b.customPoint}</p><dl><div><dt>オーナー</dt><dd>{b.owner}</dd></div><div><dt>メーカー</dt><dd>{b.maker}</dd></div><div><dt>車種</dt><dd>{b.model}</dd></div><div><dt>年式</dt><dd>{b.year}</dd></div><div><dt>排気量</dt><dd>{b.cc}</dd></div></dl></section><aside><h2>カスタム内容</h2><p>マフラー、ハンドル、シート、足まわりなど。詳しいパーツ名は自由記入で掲載します。</p>{b.sale&&<div className="forSaleBox"><strong>売ります</strong><p>掲載中の車両です。取引は売主と購入希望者の当事者間で行います。</p><button className="primary">オーナーへ問い合わせ</button></div>}{b.sold&&<div className="soldBox">SOLD<br/><small>売却後も図鑑として掲載しています。</small></div>}</aside></div></article></main>;
  }

  const supabase = await createClient();
  const { data: bike, error } = await supabase
    .from("bikes")
    .select("id, maker, model, year, cc, style, status, custom_point, instagram_url, is_sale, is_sold, profiles!bikes_owner_id_fkey(nickname)")
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

  const owner = (bike as any).profiles?.nickname ?? "unknown";
  const instagram: string | null = (bike as any).instagram_url;
  const instagramHref = instagram
    ? instagram.startsWith("http")
      ? instagram
      : `https://instagram.com/${instagram.replace(/^[@＠]/, "")}`
    : null;

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/bikes">← 一覧へ戻る</a></header>
      <article className="detailWrap">
        <div className="detailTitle">
          <div>
            <p className="eyebrow">{bike.maker}</p>
            <h1>{bike.model}</h1>
            <p>{bike.year ?? "-"} / {bike.cc ? `${bike.cc}cc` : "-"} / {bike.style ?? "-"}</p>
          </div>
          <div className="detailActions">
            <span className={`statusPill ${bike.status}`}>{statusLabel[bike.status as BikeStatus]}</span>
            <FavoriteButton id={bike.id} />
          </div>
        </div>
        <PhotoGallery photos={photos} />
        <div className="detailColumns">
          <section>
            <h2>このバイクについて</h2>
            <p>{bike.custom_point}</p>
            <dl>
              <div><dt>オーナー</dt><dd>{owner}</dd></div>
              <div><dt>メーカー</dt><dd>{bike.maker}</dd></div>
              <div><dt>車種</dt><dd>{bike.model}</dd></div>
              <div><dt>年式</dt><dd>{bike.year ?? "-"}</dd></div>
              <div><dt>排気量</dt><dd>{bike.cc ? `${bike.cc}cc` : "-"}</dd></div>
              {instagramHref && <div><dt>Instagram</dt><dd><a href={instagramHref} target="_blank" rel="noreferrer">{instagram}</a></dd></div>}
            </dl>
          </section>
          <aside>
            <h2>カスタム内容</h2>
            <p>マフラー、ハンドル、シート、足まわりなど。詳しいパーツ名は自由記入で掲載します。</p>
            {bike.is_sale && <div className="forSaleBox"><strong>売ります</strong><p>掲載中の車両です。取引は売主と購入希望者の当事者間で行います。</p><button className="primary">オーナーへ問い合わせ</button></div>}
            {bike.is_sold && <div className="soldBox">SOLD<br/><small>売却後も図鑑として掲載しています。</small></div>}
          </aside>
        </div>
      </article>
    </main>
  );
}
