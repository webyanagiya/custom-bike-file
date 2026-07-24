"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password !== passwordConfirm) {
      setMessage("パスワードが一致しません。");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (error) {
      setMessage(`パスワードの更新に失敗しました：${error.message}`);
      return;
    }

    setMessage("パスワードを更新しました。ログイン画面へ移動します…");
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="authCard">
        <p className="eyebrow">RESET PASSWORD</p>
        <h1>新しいパスワードを設定</h1>
        <form onSubmit={submit}>
          <label>新しいパスワード<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <label>新しいパスワード（確認）<input type="password" required minLength={6} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="••••••••" /></label>
          <button className="primary" type="submit" disabled={submitting}>{submitting ? "更新中…" : "パスワードを更新する"}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
