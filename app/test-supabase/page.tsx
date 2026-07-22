import { createClient } from "../../lib/supabase/server";

export default async function TestSupabasePage() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("bikes").select("*");

  return (
    <main className="subPage">
      <header className="subHeader">
        <a className="brand" href="/">CUSTOM BIKE FILE</a>
        <a href="/">トップへ戻る</a>
      </header>
      <section className="catalog">
        <p className="eyebrow">SUPABASE CONNECTION TEST</p>
        <h1>bikesテーブル読み込みテスト</h1>
        {error ? (
          <>
            <p className="intro">接続エラーが発生しました。</p>
            <pre>{JSON.stringify(error, null, 2)}</pre>
          </>
        ) : (
          <>
            <p className="intro">{data?.length ?? 0}件のバイクが見つかりました。</p>
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </>
        )}
      </section>
    </main>
  );
}
