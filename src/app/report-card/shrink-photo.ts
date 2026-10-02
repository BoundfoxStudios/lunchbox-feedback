import { maximumPhotoDataUrlLength } from '../../shared/report-card';

const maximumEdgeLength = 1280;
const jpegQualities = [0.82, 0.7, 0.6, 0.5];

export async function shrinkPhoto(file: Blob): Promise<string> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, maximumEdgeLength / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.width * scale);
    canvas.height = Math.round(image.height * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context is unavailable');
    }
    // JPEG has no alpha channel: transparent PNG areas would turn black without a white base.
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    let dataUrl = '';
    for (const quality of jpegQualities) {
      dataUrl = canvas.toDataURL('image/jpeg', quality);
      if (dataUrl.length <= maximumPhotoDataUrlLength) {
        break;
      }
    }
    return dataUrl;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = source;
  });
}
