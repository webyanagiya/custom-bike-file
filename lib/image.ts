export type ImagePreview = { name: string; url: string; size: number; blob: Blob };

export async function compressImage(file: File): Promise<ImagePreview> {
  const image = await createImageBitmap(file);
  const maxSide = 1800;
  const ratio = Math.min(1, maxSide / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * ratio);
  canvas.height = Math.round(image.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("画像を処理できませんでした");
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  if (!blob) throw new Error("画像を圧縮できませんでした");
  return { name: file.name, url: URL.createObjectURL(blob), size: blob.size, blob };
}
