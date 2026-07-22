import "./globals.css";

export const metadata = {
  title: "CUSTOM BIKE FILE",
  description: "日本中のカスタムバイクを集めた、改造好きのための参考書・図鑑です。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
