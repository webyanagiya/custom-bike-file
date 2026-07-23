// 大文字/小文字・全角/半角・スペース・ハイフンの違いを吸収した比較用の正規化。
// 例: "ｃｂ４００" / "CB-400" / "cb 400" はすべて "cb400" になる。
export function normalizeForMatch(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/[\s\-]/g, "");
}
