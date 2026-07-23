import { BikeSearchGrid } from "../components";
import { bikeFiles, BikeStatus } from "../data";
import { createClient } from "../../lib/supabase/server";

export default async function Bikes({ searchParams }: { searchParams: Promise<{ cc?: string; keyword?: string; status?: string }> }) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("bikes")
    .select("id, maker, model, year, cc, style, status, is_sale, is_sold, views, custom_point, profiles!bikes_owner_id_fkey(nickname)")
    .order("created_at", { ascending: false });

  const bikeRows = error || !data ? [] : data;
  const ids = bikeRows.map((b: any) => b.id);
  const { data: photoRows } = ids.length > 0
    ? await supabase.from("bike_photos").select("bike_id, storage_path").in("bike_id", ids).eq("sort_order", 0)
    : { data: [] as { bike_id: string; storage_path: string }[] };

  const thumbnailByBike = new Map(
    (photoRows ?? []).map((p) => [p.bike_id, supabase.storage.from("bike-photos").getPublicUrl(p.storage_path).data.publicUrl]),
  );

  const liveBikes = bikeRows.map((b: any) => ({
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
    thumbnailUrl: thumbnailByBike.get(b.id),
  }));

  const bikes = [...liveBikes, ...bikeFiles.map((b) => ({ ...b, thumbnailUrl: undefined as string | undefined }))];

  // 車名オートコンプリートの候補は実際の投稿データのみが対象（大文字・小文字の違いだけを吸収して重複排除）。
  const modelByKey = new Map<string, string>();
  for (const b of bikeRows as any[]) {
    const key = b.model.trim().toLowerCase();
    if (!modelByKey.has(key)) modelByKey.set(key, b.model);
  }
  const modelOptions = [...modelByKey.values()].sort();

  return <main className="subPage"><header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/post">＋ バイクを投稿</a></header><section className="catalog"><p className="eyebrow">BIKE FILES</p><h1>バイクを探す</h1><p className="intro">車名、排気量、現在の状態から探せます。ノーマル車も、カスタム途中の一台も掲載できます。</p><BikeSearchGrid bikes={bikes} initialCc={params.cc ?? ""} initialKeyword={params.keyword ?? ""} initialStatus={params.status ?? ""} modelOptions={modelOptions}/></section></main>;
}
