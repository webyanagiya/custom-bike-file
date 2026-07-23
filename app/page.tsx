import { bikeFiles, BikeStatus } from "./data";
import { BikeCard, MakerSearchInput } from "./components";
import { InFeedAdSlot, SidebarAdSlot } from "./AdSlot";
import { getActiveInFeedAd, getActiveSidebarAd } from "../lib/ads";
import { createClient } from "../lib/supabase/server";

const MAKERS = ["HONDA", "KAWASAKI", "YAMAHA", "SUZUKI", "HARLEY-DAVIDSON", "DUCATI", "BMW"];
const DISPLACEMENTS = [
  { code: "50", label: "50cc" },
  { code: "125", label: "125cc" },
  { code: "250", label: "250cc" },
  { code: "400", label: "400cc" },
  { code: "750", label: "750cc" },
  { code: "900", label: "900cc" },
  { code: "1000plus", label: "1000cc以上" },
];

export default async function Home() {
  const supabase = await createClient();
  const [inFeedAd, sidebarAd] = await Promise.all([getActiveInFeedAd(), getActiveSidebarAd()]);
  const { data: bikeRows } = await supabase
    .from("bikes")
    .select("id, maker, model, year, cc, style, status, is_sale, is_sold")
    .order("created_at", { ascending: false })
    .limit(6);

  const ids = (bikeRows ?? []).map((b) => b.id);
  const { data: photoRows } = ids.length > 0
    ? await supabase.from("bike_photos").select("bike_id, storage_path").in("bike_id", ids).eq("sort_order", 0)
    : { data: [] as { bike_id: string; storage_path: string }[] };

  const thumbnailByBike = new Map(
    (photoRows ?? []).map((p) => [p.bike_id, supabase.storage.from("bike-photos").getPublicUrl(p.storage_path).data.publicUrl]),
  );

  const liveBikes = (bikeRows ?? []).map((b: any) => ({
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
    thumbnailUrl: thumbnailByBike.get(b.id),
  }));

  const bikes = [...liveBikes, ...bikeFiles.map((b) => ({ ...b, thumbnailUrl: undefined as string | undefined }))].slice(0, 6);

  const { data: makerRows } = await supabase.from("bikes").select("maker");
  const makerList = [...new Set([...(makerRows ?? []).map((r) => r.maker), ...bikeFiles.map((b) => b.maker)])].sort();

  const cards = bikes.map((bike, index) => (
    <BikeCard key={bike.id} bike={bike} index={index} thumbnailUrl={bike.thumbnailUrl} />
  ));
  if (inFeedAd) {
    cards.splice(3, 0, <InFeedAdSlot key="in-feed-ad" ad={inFeedAd} />);
  }
  const grid = <div className="grid">{cards}</div>;

  return (
    <main>
      <header className="siteHeader">
        <div className="brand">CUSTOM BIKE FILE</div>
        <nav>
          <a href="#bikes">バイクを見る</a>
          <a href="/shops">ショップ</a>
          <a href="/login">ログイン</a>
          <a className="navButton" href="/mypage">マイページ</a>
        </nav>
      </header>

      <section className="hero">
        <div className="heroInner">
          <p className="eyebrow">CUSTOM BIKE GALLERY</p>
          <h1>日本最大級のカスタムバイクギャラリーを目指しています。</h1>
          <p className="lead">あなたの一台が、このギャラリーをつくります。</p>
          <p className="heroDescription">全国のライダーが愛車を記録し、<br />つながる場所。</p>
          <div className="heroActions">
            <a className="primary buttonLink" href="/bikes">カスタムバイクを見る</a>
            <a className="secondary buttonLink" href="/post">自分のバイクを投稿する</a>
          </div>
        </div>
      </section>

      <form className="searchPanel" aria-label="バイク検索" action="/bikes" method="get">
        <MakerSearchInput makers={makerList} />
        <select name="cc" defaultValue="">
          <option value="">排気量</option>
          {DISPLACEMENTS.map((d) => <option key={d.code} value={d.code}>{d.label}</option>)}
        </select>
        <input name="keyword" placeholder="車種名で検索" />
        <button className="primary" type="submit">検索する</button>
      </form>

      <section id="bikes" className="section">
        <div className="sectionHead">
          <div><p className="eyebrow">LATEST FILES</p><h2>新着カスタムバイク</h2></div>
          <a href="/bikes">もっと見る →</a>
        </div>
        {sidebarAd ? (
          <div className="withSidebar">
            {grid}
            <aside><SidebarAdSlot ad={sidebarAd} /></aside>
          </div>
        ) : grid}
      </section>

      <section className="section">
        <div className="sectionHead"><div><p className="eyebrow">MAKERS</p><h2>メーカーから探す</h2></div></div>
        <div className="heroActions">
          {MAKERS.map((m) => <a key={m} className="secondary buttonLink" href={`/bikes?maker=${encodeURIComponent(m)}`}>{m}</a>)}
        </div>
      </section>

      <section className="section">
        <div className="sectionHead"><div><p className="eyebrow">DISPLACEMENT</p><h2>排気量から探す</h2></div></div>
        <div className="heroActions">
          {DISPLACEMENTS.map((d) => <a key={d.code} className="secondary buttonLink" href={`/bikes?cc=${d.code}`}>{d.label}</a>)}
        </div>
      </section>

      <section className="sellSection">
        <div>
          <p className="eyebrow">SHOP FILE</p>
          <h2>あなたの街の、腕のあるショップを探す。</h2>
        </div>
        <a className="primary buttonLink" href="/shops">全国のショップを見る</a>
      </section>

      <section className="welcomeSection">
        <p className="eyebrow">ABOUT</p>
        <h2>CUSTOM BIKE FILEとは？</h2>
        <p>日本中のカスタムバイクを集めた、改造好きのための参考書・図鑑です。<br />ノーマル車も、カスタム途中の一台も、そのままの状態で記録として投稿できます。</p>
        <div className="welcomeTags"><span>投稿は無料</span><span>ショップ掲載無料</span><span>売ります掲載980円（30日）</span></div>
      </section>

      {/* Static placeholder for now; will become a real sponsor-slot area
          (oil/tire/parts makers, gear shops, insurers, buyback, shops) once
          sponsor data exists. No fetching or ad logic added yet. */}
      <section className="welcomeSection">
        <p className="eyebrow">SPONSORS</p>
        <h2>スポンサー</h2>
        <p>現在スポンサー募集中です。</p>
      </section>

      <footer>
        <div className="brand">CUSTOM BIKE FILE</div>
        <p>日本中のカスタムバイクを集めた、改造好きのための参考書・図鑑です。</p>
        <nav className="footerLinks">
          <a href="/terms">利用規約</a>
          <a href="/privacy">プライバシーポリシー</a>
          <a href="/contact">お問い合わせ</a>
          <a href="#">Instagram</a>
        </nav>
        <small>© CUSTOM BIKE FILE</small>
      </footer>
    </main>
  );
}
