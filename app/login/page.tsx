"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setMessage("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      return;
    }
    router.push("/mypage");
    router.refresh();
  }

  return (
    <main className="subPage">
      <header className="subHeader"><a className="brand" href="/">CUSTOM BIKE FILE</a><a href="/">トップへ戻る</a></header>
      <section className="authCard">
        <p className="eyebrow">MEMBER LOGIN</p>
        <h1>ログイン</h1>
        <form onSubmit={submit}>
          <label>メールアドレス<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="mail@example.com" /></label>
          <label>パスワード<input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" /></label>
          <button className="primary" type="submit" disabled={submitting}>{submitting ? "ログイン中…" : "ログインする"}</button>
        </form>
        {message && <p className="formMessage">{message}</p>}
        <p>アカウントをお持ちでない方は <a href="/signup">無料登録へ</a></p>
      </section>
    </main>
  );
}
