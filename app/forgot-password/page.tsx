"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);

    if (error) {
      setMessage(`送信に失敗しました：${error.message}`);
      return;
    }

    setMessage("パスワード再設定用のメールを送信しました。メール内のリンクから新しいパスワードを設定してください。");
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="authCard">
        <p className="eyebrow">RESET PASSWORD</p>
        <h1>パスワードをお忘れの方</h1>
        <form onSubmit={submit}>
          <label>メールアドレス<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" /></label>
          <button className="primary" type="submit" disabled={submitting}>{submitting ? "送信中…" : "再設定メールを送信する"}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
        <p><a href="/login">ログイン画面へ戻る</a></p>
      </section>
    </main>
  );
}
