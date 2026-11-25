/**
 * Compresses image data URLs so they stay crisp for CT/Endoscopy review
 * while remaining safely below Firestore's document size limits (< 750KB).
 */
export async function compressImageToDataUrl(
  fileOrDataUrl: File | string,
  maxDimension = 1280,
  quality = 0.78
): Promise<string> {
  const rawDataUrl =
    typeof fileOrDataUrl === 'string'
      ? fileOrDataUrl
      : await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string) || '');
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(fileOrDataUrl);
        });

  if (!rawDataUrl) return '';

  // Keep SVG placeholders or already compact images (< 180KB) untouched
  if (rawDataUrl.startsWith('data:image/svg+xml') || rawDataUrl.length < 180_000) {
    return rawDataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(rawDataUrl.slice(0, 740_000));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      let compressed = canvas.toDataURL('image/jpeg', quality);
      if (compressed.length > 700_000) {
        compressed = canvas.toDataURL('image/jpeg', 0.58);
      }
      resolve(compressed);
    };
    img.onerror = () => resolve(rawDataUrl);
    img.src = rawDataUrl;
  });
}
