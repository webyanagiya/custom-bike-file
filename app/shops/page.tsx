import { createClient } from "../../lib/supabase/server";
import { ShopSearchGrid } from "../components";

export default async function ShopsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shops")
    .select("id, name, prefecture, specialty, photo_url")
    .eq("is_approved", true)
    .order("name", { ascending: true });

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="catalog">
        <p className="eyebrow">SHOP FILE</p>
        <h1>ショップ</h1>
        <p className="intro">個人・法人を問わず、小さなバイクショップやチューニングショップを無償で掲載します。</p>
        <ShopSearchGrid shops={data ?? []} />
      </section>
    </main>
  );
}
