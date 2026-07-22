import { notFound, redirect } from "next/navigation";
import { createClient } from "../../../../lib/supabase/server";

export default async function SellSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: bike, error } = await supabase
    .from("bikes")
    .select("id, owner_id, maker, model, is_sale, sale_expires_at")
    .eq("id", id)
    .single();

  if (error || !bike || bike.owner_id !== user.id) {
    notFound();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/mypage">マイページへ戻る</a></header>
      <section className="formWrap">
        <p className="eyebrow">FOR SALE</p>
        <h1>売ります設定</h1>
        <p className="intro">{bike.maker} {bike.model} を「売ります」として掲載するための設定画面です。</p>

        <div className="notice">
          <p><strong>決済準備中</strong></p>
          <p>掲載料金：980円（税込）／掲載期間：30日間</p>
          <p>お支払い方法（Stripe決済）は現在準備中です。決済が完了するまで、この画面から「売ります」表示を有効にすることはできません。</p>
        </div>

        <div className="notice">
          <p><strong>注意事項・免責事項</strong></p>
          <p>売買は当事者同士の責任で行います。CUSTOM BIKE FILEは契約、代金、車両状態、名義変更などには関与しません。決済完了後、掲載期間は30日間で自動的に終了します。掲載後の取り消し・返金についても運営は関与しません。</p>
        </div>

        {bike.is_sale && bike.sale_expires_at && (
          <p className="intro">現在「売ります」として掲載中です（掲載終了予定：{new Date(bike.sale_expires_at).toLocaleDateString("ja-JP")}）。</p>
        )}

        <button className="primary submitButton" type="button" disabled>Stripeで支払う（準備中）</button>
      </section>
    </main>
  );
}
