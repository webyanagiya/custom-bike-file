"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
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
    const { data, error } = await supabase.auth.signUp({ email, password });
    setSubmitting(false);

    if (error) {
      console.error("signUp error:", error);
      setMessage(`登録に失敗しました：${error.message}`);
      return;
    }

    if (data.session) {
      router.push("/mypage");
      router.refresh();
      return;
    }

    setMessage("確認メールを送信しました。メール内のリンクを開いて登録を完了してください。");
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="authCard">
        <p className="eyebrow">MEMBER SIGNUP</p>
        <h1>新規会員登録</h1>
        <form onSubmit={submit}>
          <label>メールアドレス<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" /></label>
          <label>パスワード<input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <label>パスワード（確認）<input type="password" required minLength={6} value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} placeholder="••••••••" /></label>
          <button className="primary" type="submit" disabled={submitting}>{submitting ? "登録中…" : "登録する"}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
        <p>すでにアカウントをお持ちの方は <a href="/login">ログインへ</a></p>
      </section>
    </main>
  );
}
