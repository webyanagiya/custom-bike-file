import { BikeSearchGrid } from "../components";
import { bikeFiles, BikeStatus } from "../data";
import { createClient } from "../../lib/supabase/server";

export default async function Bikes({ searchParams }: { searchParams: Promise<{ maker?: string; cc?: string; keyword?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bikes")
    .select("id, maker, model, year, cc, style, status, is_sale, is_sold, views, custom_point, profiles!bikes_owner_id_fkey(nickname)")
    .order("created_at", { ascending: false });

  const liveBikes = error || !data ? [] : data.map((b: any) => ({
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
    owner: b.profiles?.nickname ?? "unknown",
    customPoint: b.custom_point ?? "",
  }));

  const bikes = [...liveBikes, ...bikeFiles];

  return <main className="subPage"><header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/post">＋ バイクを投稿</a></header><section className="catalog"><p className="eyebrow">BIKE FILES</p><h1>バイクを探す</h1><p className="intro">メーカー、排気量、車種、現在の状態から探せます。ノーマル車も、カスタム途中の一台も掲載できます。</p><BikeSearchGrid bikes={bikes} initialMaker={params.maker ?? ""} initialCc={params.cc ?? ""} initialKeyword={params.keyword ?? ""}/></section></main>;
}
