import { notFound } from "next/navigation";
import { createClient } from "../../../lib/supabase/server";
import { BikeCard } from "../../components";
import { BikeStatus } from "../../data";

export default async function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: shop, error } = await supabase
    .from("shops")
    .select("id, name, prefecture, address, business_hours, closed_days, instagram, youtube, phone, website_url, description, specialty, photo_url, is_approved")
    .eq("id", id)
    .single();

  if (error || !shop || !shop.is_approved) {
    notFound();
  }

  const [{ data: bikeRows }, { data: eventRows }] = await Promise.all([
    supabase
      .from("bikes")
      .select("id, maker, model, year, cc, style, status, is_sale, is_sold")
      .eq("shop_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, event_date, prefecture, venue, organizer, description")
      .eq("shop_id", id)
      .eq("is_approved", true)
      .order("event_date", { ascending: true }),
  ]);

  const bikes = (bikeRows ?? []).map((b: any) => ({
    id: b.id,
    maker: b.maker,
    model: b.model,
    year: b.year ? String(b.year) : "",
    cc: b.cc ? `${b.cc}cc` : "",
    style: b.style ?? "",
    status: b.status as BikeStatus,
    sale: b.is_sale,
    sold: b.is_sold,
    views: 0,
    owner: "",
    customPoint: "",
  }));

  const mapHref = shop.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(shop.address)}`
    : null;

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/shops">← ショップ一覧へ戻る</a></header>
      <article className="detailWrap">
        <div className="detailTitle">
          <div>
            <p className="eyebrow">{shop.prefecture}</p>
            <h1>{shop.name}</h1>
            {shop.specialty && <p>{shop.specialty}</p>}
          </div>
        </div>

        <div className="shopPhoto" style={{ minHeight: 320 }}>{shop.photo_url && <img src={shop.photo_url} alt={shop.name} className="realPhoto" />}</div>

        <div className="detailColumns">
          <section>
            <h2>ショップ紹介</h2>
            <p>{shop.description}</p>
            <dl>
              <div><dt>住所</dt><dd>{shop.address}{mapHref && <> ／ <a href={mapHref} target="_blank" rel="noreferrer">Googleマップで見る</a></>}</dd></div>
              <div><dt>電話番号</dt><dd>{shop.phone ?? "-"}</dd></div>
              <div><dt>ホームページ</dt><dd>{shop.website_url ? <a href={shop.website_url} target="_blank" rel="noreferrer">{shop.website_url}</a> : "-"}</dd></div>
              <div><dt>Instagram</dt><dd>{shop.instagram ?? "-"}</dd></div>
              <div><dt>YouTube</dt><dd>{shop.youtube ? <a href={shop.youtube} target="_blank" rel="noreferrer">{shop.youtube}</a> : "-"}</dd></div>
              <div><dt>営業時間</dt><dd>{shop.business_hours ?? "-"}</dd></div>
              <div><dt>定休日</dt><dd>{shop.closed_days ?? "-"}</dd></div>
            </dl>
          </section>
          <aside>
            <h2>イベント情報</h2>
            {(eventRows ?? []).length === 0 ? <p>現在掲載中のイベントはありません。</p> : (
              <div className="eventList">
                {(eventRows ?? []).map((ev: any) => {
                  const d = new Date(ev.event_date);
                  return (
                    <article className="eventCard" key={ev.id}>
                      <div className="eventDate"><strong>{d.getDate()}</strong><span>{d.toLocaleDateString("en-US", { month: "short" }).toUpperCase()}</span></div>
                      <div><small>{ev.prefecture}</small><h2>{ev.title}</h2><p>{ev.venue}{ev.organizer ? ` / ${ev.organizer}` : ""}</p></div>
                    </article>
                  );
                })}
              </div>
            )}
          </aside>
        </div>

        <h2 className="myBikesTitle">このショップが製作したバイク</h2>
        {bikes.length === 0 ? <p className="intro">まだ掲載されているバイクはありません。</p> : (
          <div className="grid">{bikes.map((b, i) => <BikeCard key={b.id} bike={b} index={i} />)}</div>
        )}
      </article>
    </main>
  );
}
