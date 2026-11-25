export const maxPortraitUploadBytes = 10 * 1024 * 1024;
const maxSavedPortraitBytes = 1024 * 1024;

async function downsizePortrait(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw Error('Could not resize portrait.');

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    for (const maxSide of [1280, 960, 720]) {
      const scale = Math.min(1, maxSide / longestSide);
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      context.fillStyle = '#201c1d';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const resized = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.85),
      );
      if (resized && resized.size <= maxSavedPortraitBytes) return resized;
    }
    throw Error('Portrait is too large after resizing.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readPortraitUpload(file: File) {
  const image =
    file.size <= maxSavedPortraitBytes ? file : await downsizePortrait(file);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(image);
  });
}
