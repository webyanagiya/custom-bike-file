"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BikeStatusFields } from "../components";
import { BikeStatus } from "../data";
import { createClient } from "../../lib/supabase/client";
import { compressImage, ImagePreview } from "../../lib/image";

export function PostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [status, setStatus] = useState<BikeStatus>("normal");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const remaining = useMemo(() => 30 - images.length, [images.length]);

  async function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > remaining) {
      setMessage(`追加できる写真はあと${remaining}枚です。`);
      return;
    }
    setMessage("画像を自動圧縮しています…");
    try {
      const compressed = await Promise.all(files.map(compressImage));
      setImages((current) => [...current, ...compressed]);
      setMessage(`${compressed.length}枚を追加しました。1枚目がサムネイルになります。`);
    } catch {
      setMessage("画像処理に失敗しました。別の画像でお試しください。");
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= images.length) return;
    setImages((current) => {
      const copied = [...current];
      [copied[index], copied[next]] = [copied[next], copied[index]];
      return copied;
    });
  }

  function removeImage(index: number) {
    setImages((current) => current.filter((_, i) => i !== index));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("投稿を保存しています…");

    const form = new FormData(event.currentTarget);
    const yearValue = form.get("year") ? Number(form.get("year")) : null;
    const ccDigits = String(form.get("cc") ?? "").replace(/[^0-9]/g, "");

    const supabase = createClient();

    const { data: bike, error: bikeError } = await supabase
      .from("bikes")
      .insert({
        owner_id: userId,
        maker: String(form.get("maker") ?? "").trim(),
        model: String(form.get("model") ?? "").trim(),
        year: yearValue,
        cc: ccDigits ? Number(ccDigits) : null,
        status,
        title: String(form.get("title") ?? "").trim(),
        custom_point: String(form.get("details") ?? "").trim() || null,
        instagram_url: String(form.get("instagram") ?? "").trim() || null,
      })
      .select("id")
      .single();

    if (bikeError || !bike) {
      setSubmitting(false);
      setMessage(`投稿の保存に失敗しました：${bikeError?.message ?? "不明なエラー"}`);
      return;
    }

    for (let i = 0; i < images.length; i++) {
      const path = `${userId}/${bike.id}/${i}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("bike-photos")
        .upload(path, images[i].blob, { contentType: "image/webp" });

      if (uploadError) {
        setSubmitting(false);
        setMessage(`写真のアップロードに失敗しました（${i + 1}枚目）：${uploadError.message}`);
        return;
      }

      const { error: photoError } = await supabase
        .from("bike_photos")
        .insert({ bike_id: bike.id, storage_path: path, sort_order: i });

      if (photoError) {
        setSubmitting(false);
        setMessage(`写真情報の保存に失敗しました（${i + 1}枚目）：${photoError.message}`);
        return;
      }
    }

    setMessage("投稿が完了しました。一覧ページへ移動します…");
    router.push("/bikes");
    router.refresh();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="formWrap">
        <p className="eyebrow">ADD NEW FILE</p>
        <h1>カスタムバイクを投稿する</h1>
        <p className="intro">文章は最低限で大丈夫です。写真を主役に、あなたの一台を図鑑へ残してください。</p>
        <form onSubmit={submit} className="postForm">
          <div className="formGrid">
            <label>メーカー<input required name="maker" placeholder="例：KAWASAKI" /></label>
            <label>車種<input required name="model" placeholder="例：Z900RS" /></label>
            <label>年式<input name="year" inputMode="numeric" placeholder="例：2023" /></label>
            <label>排気量<input name="cc" inputMode="numeric" placeholder="例：948cc" /></label>
            <label>Instagram（任意）<input name="instagram" placeholder="@your_account" /></label>
          </div>
          <BikeStatusFields value={status} onChange={setStatus} />
          <label>投稿タイトル<input required name="title" placeholder="例：黒を基調に仕上げたZ900RS" /></label>
          <label>カスタム内容<textarea name="details" rows={7} placeholder="改造箇所、使用パーツ、こだわった点などを自由に入力してください。" /></label>
          <div className="uploadBox">
            <div><strong>写真を追加</strong><p>最大30枚・自動圧縮。JPEG / PNG / WebPに対応。</p></div>
            <label className="uploadButton">写真を選ぶ<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImages} /></label>
          </div>
          <p className="counter">{images.length} / 30枚</p>
          {images.length > 0 && <div className="previewGrid">{images.map((image, index) => (
            <div className="previewItem" key={`${image.name}-${index}`}>
              <img src={image.url} alt={`投稿写真${index + 1}`} />
              <div className="previewMeta"><span>{index === 0 ? "サムネイル" : `${index + 1}枚目`}</span><small>{Math.round(image.size / 1024)}KB</small></div>
              <div className="previewActions"><button type="button" onClick={() => moveImage(index, -1)}>←</button><button type="button" onClick={() => moveImage(index, 1)}>→</button><button type="button" onClick={() => removeImage(index)}>削除</button></div>
            </div>
          ))}</div>}
          <label className="checkRow"><input type="checkbox" name="forSale" />このバイクに「売ります」を掲載する（980円・30日）</label>
          <p className="notice">売買は当事者同士の責任で行います。CUSTOM BIKE FILEは契約、代金、車両状態、名義変更などには関与しません。（決済連携は準備中のため、現在このチェックは掲載に反映されません）</p>
          <button className="primary submitButton" type="submit" disabled={submitting}>{submitting ? "保存中…" : "投稿内容を確認する"}</button>
          {message && <p className="formMessage">{message}</p>}
        </form>
      </section>
    </main>
  );
}
