"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BikeStatusFields } from "../../../components";
import { BikeStatus } from "../../../data";
import { createClient } from "../../../../lib/supabase/client";
import { compressImage, ImagePreview } from "../../../../lib/image";

type ExistingPhoto = { id: string; path: string; sortOrder: number; url: string };

type BikeRecord = {
  id: string;
  maker: string;
  model: string;
  year: number | null;
  cc: number | null;
  style: string | null;
  status: string;
  title: string;
  custom_point: string | null;
  instagram_url: string | null;
};

export function EditBikeForm({ bike, photos, userId }: { bike: BikeRecord; photos: ExistingPhoto[]; userId: string }) {
  const router = useRouter();
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>(photos);
  const [newImages, setNewImages] = useState<ImagePreview[]>([]);
  const [status, setStatus] = useState<BikeStatus>(bike.status as BikeStatus);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const remaining = useMemo(() => 30 - existingPhotos.length - newImages.length, [existingPhotos.length, newImages.length]);

  async function handleImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length > remaining) {
      setMessage(`追加できる写真はあと${remaining}枚です。`);
      return;
    }
    setMessage("画像を自動圧縮しています…");
    try {
      const compressed = await Promise.all(files.map(compressImage));
      setNewImages((current) => [...current, ...compressed]);
      setMessage(`${compressed.length}枚を追加しました。`);
    } catch {
      setMessage("画像処理に失敗しました。別の画像でお試しください。");
    }
  }

  function removeNewImage(index: number) {
    setNewImages((current) => current.filter((_, i) => i !== index));
  }

  async function removeExistingPhoto(photo: ExistingPhoto) {
    setSubmitting(true);
    const supabase = createClient();
    await supabase.storage.from("bike-photos").remove([photo.path]);
    await supabase.from("bike_photos").delete().eq("id", photo.id);
    setExistingPhotos((current) => current.filter((p) => p.id !== photo.id));
    setSubmitting(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("保存しています…");

    const form = new FormData(event.currentTarget);
    const yearValue = form.get("year") ? Number(form.get("year")) : null;
    const ccDigits = String(form.get("cc") ?? "").replace(/[^0-9]/g, "");

    const supabase = createClient();

    const { error: updateError } = await supabase
      .from("bikes")
      .update({
        maker: String(form.get("maker") ?? "").trim(),
        model: String(form.get("model") ?? "").trim(),
        year: yearValue,
        cc: ccDigits ? Number(ccDigits) : null,
        status,
        title: String(form.get("title") ?? "").trim(),
        custom_point: String(form.get("details") ?? "").trim() || null,
        instagram_url: String(form.get("instagram") ?? "").trim() || null,
      })
      .eq("id", bike.id);

    if (updateError) {
      setSubmitting(false);
      setMessage(`保存に失敗しました：${updateError.message}`);
      return;
    }

    let nextSortOrder = existingPhotos.reduce((max, p) => Math.max(max, p.sortOrder), -1) + 1;
    for (const image of newImages) {
      const path = `${userId}/${bike.id}/${nextSortOrder}.webp`;
      const { error: uploadError } = await supabase.storage
        .from("bike-photos")
        .upload(path, image.blob, { contentType: "image/webp" });

      if (uploadError) {
        setSubmitting(false);
        setMessage(`写真のアップロードに失敗しました：${uploadError.message}`);
        return;
      }

      const { error: photoError } = await supabase
        .from("bike_photos")
        .insert({ bike_id: bike.id, storage_path: path, sort_order: nextSortOrder });

      if (photoError) {
        setSubmitting(false);
        setMessage(`写真情報の保存に失敗しました：${photoError.message}`);
        return;
      }
      nextSortOrder += 1;
    }

    setMessage("保存が完了しました。詳細ページへ移動します…");
    router.push(`/bikes/${bike.id}`);
    router.refresh();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/mypage">マイページへ戻る</a></header>
      <section className="formWrap">
        <p className="eyebrow">EDIT FILE</p>
        <h1>投稿を編集する</h1>
        <form onSubmit={submit} className="postForm">
          <div className="formGrid">
            <label>メーカー<input required name="maker" defaultValue={bike.maker} /></label>
            <label>車種<input required name="model" defaultValue={bike.model} /></label>
            <label>年式<input name="year" inputMode="numeric" defaultValue={bike.year ?? ""} /></label>
            <label>排気量<input name="cc" inputMode="numeric" defaultValue={bike.cc ?? ""} /></label>
            <label>Instagram（任意）<input name="instagram" defaultValue={bike.instagram_url ?? ""} /></label>
          </div>
          <BikeStatusFields value={status} onChange={setStatus} />
          <label>投稿タイトル<input required name="title" defaultValue={bike.title} /></label>
          <label>カスタム内容<textarea name="details" rows={7} defaultValue={bike.custom_point ?? ""} /></label>

          <div className="uploadBox">
            <div><strong>写真</strong><p>既存の写真は「削除」で個別に消せます。最大30枚まで追加できます。</p></div>
            <label className="uploadButton">写真を選ぶ<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleImages} /></label>
          </div>
          <p className="counter">{existingPhotos.length + newImages.length} / 30枚</p>

          {existingPhotos.length > 0 && <div className="previewGrid">{existingPhotos.map((photo, index) => (
            <div className="previewItem" key={photo.id}>
              <img src={photo.url} alt={`写真${index + 1}`} />
              <div className="previewMeta"><span>{index === 0 ? "サムネイル" : `${index + 1}枚目`}</span></div>
              <div className="previewActions"><button type="button" disabled={submitting} onClick={() => removeExistingPhoto(photo)}>削除</button></div>
            </div>
          ))}</div>}

          {newImages.length > 0 && <div className="previewGrid">{newImages.map((image, index) => (
            <div className="previewItem" key={`${image.name}-${index}`}>
              <img src={image.url} alt={`新しい写真${index + 1}`} />
              <div className="previewMeta"><span>新規</span><small>{Math.round(image.size / 1024)}KB</small></div>
              <div className="previewActions"><button type="button" onClick={() => removeNewImage(index)}>削除</button></div>
            </div>
          ))}</div>}

          <button className="primary submitButton" type="submit" disabled={submitting}>{submitting ? "保存中…" : "保存する"}</button>
          {message && <p className="formMessage">{message}</p>}
        </form>
      </section>
    </main>
  );
}
