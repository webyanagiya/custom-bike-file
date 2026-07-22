"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { compressImage } from "../../lib/image";

type Profile = {
  nickname?: string | null;
  prefecture?: string | null;
  bio?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  avatar_url?: string | null;
};

export function ProfileForm({ userId, profile }: { userId: string; profile: Profile }) {
  const router = useRouter();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatar_url ?? null);
  const [avatarBlob, setAvatarBlob] = useState<Blob | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMessage("画像を処理しています…");
    try {
      const compressed = await compressImage(file);
      setAvatarPreview(compressed.url);
      setAvatarBlob(compressed.blob);
      setMessage("");
    } catch {
      setMessage("画像の処理に失敗しました。別の画像でお試しください。");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("保存しています…");

    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    let avatarUrl = profile.avatar_url ?? null;
    if (avatarBlob) {
      const path = `${userId}/avatar.webp`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarBlob, { contentType: "image/webp", upsert: true });

      if (uploadError) {
        setSubmitting(false);
        setMessage(`プロフィール画像の保存に失敗しました：${uploadError.message}`);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        nickname: String(form.get("nickname") ?? "").trim(),
        prefecture: String(form.get("prefecture") ?? "").trim() || null,
        bio: String(form.get("bio") ?? "").trim() || null,
        instagram: String(form.get("instagram") ?? "").trim() || null,
        youtube: String(form.get("youtube") ?? "").trim() || null,
        avatar_url: avatarUrl,
      })
      .eq("id", userId);

    if (updateError) {
      setSubmitting(false);
      setMessage(`保存に失敗しました：${updateError.message}`);
      return;
    }

    setMessage("保存が完了しました。マイページへ移動します…");
    router.push("/mypage");
    router.refresh();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/mypage">マイページへ戻る</a></header>
      <section className="formWrap">
        <p className="eyebrow">RIDER PROFILE</p>
        <h1>プロフィール編集</h1>
        <p className="intro">プロフィールは元の仕様どおり。オーナーよりも、投稿されたバイクが主役です。</p>
        <form onSubmit={submit} className="postForm">
          <div className="uploadBox">
            <div>
              <strong>プロフィール画像</strong>
              <p>正方形に近い画像がきれいに表示されます。</p>
            </div>
            <label className="uploadButton">画像を選ぶ<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} /></label>
          </div>
          {avatarPreview && <div className="previewGrid"><div className="previewItem"><img src={avatarPreview} alt="プロフィール画像プレビュー" /></div></div>}

          <div className="formGrid">
            <label>ニックネーム<input required name="nickname" defaultValue={profile.nickname ?? ""} placeholder="表示名" /></label>
            <label>都道府県<select name="prefecture" defaultValue={profile.prefecture ?? ""}><option value="">選択してください</option><option>滋賀県</option><option>京都府</option><option>大阪府</option><option>その他</option></select></label>
            <label>Instagram<input name="instagram" defaultValue={profile.instagram ?? ""} placeholder="@account" /></label>
            <label>YouTube<input name="youtube" defaultValue={profile.youtube ?? ""} placeholder="チャンネルURL" /></label>
          </div>
          <label>自己紹介<textarea name="bio" rows={5} defaultValue={profile.bio ?? ""} placeholder="愛車や好きなジャンルなど、自由に書いてください。" /></label>

          <button className="primary submitButton" type="submit" disabled={submitting}>{submitting ? "保存中…" : "プロフィールを保存する"}</button>
          {message && <p className="formMessage">{message}</p>}
        </form>
      </section>
    </main>
  );
}
