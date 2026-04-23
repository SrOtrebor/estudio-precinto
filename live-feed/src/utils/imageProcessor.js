// Utilidad de compresión y marca de agua — todo en el navegador del invitado
// Sin backend, sin costo adicional

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.82;

/**
 * Helper para cargar una imagen de forma asíncrona
 */
function loadImage(url, crossOrigin = false) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Error al cargar imagen en: " + url));
    img.src = url;
  });
}

/**
 * Carga una imagen desde un File y la dibuja en un canvas.
 */
export async function compressImage(file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    URL.revokeObjectURL(url);

    let { width, height } = img;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, width, height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error al generar blob de imagen"));
        },
        "image/jpeg",
        quality
      );
    });
  } catch (err) {
    URL.revokeObjectURL(url);
    throw err;
  }
}

/**
 * Superpone un PNG de marca de agua sobre la imagen ya comprimida.
 */
export async function applyWatermark(imageBlob, watermarkUrl, quality = DEFAULT_QUALITY) {
  const baseUrl = URL.createObjectURL(imageBlob);
  try {
    const baseImg = await loadImage(baseUrl);
    URL.revokeObjectURL(baseUrl);

    let watermarkImg;
    try {
      watermarkImg = await loadImage(watermarkUrl, true);
    } catch (e) {
      console.warn("No se pudo cargar el watermark, devolviendo imagen original", e);
      return imageBlob;
    }

    const canvas = document.createElement("canvas");
    canvas.width = baseImg.width;
    canvas.height = baseImg.height;

    const ctx = canvas.getContext("2d");
    // 1. Dibujamos la foto (Aseguramos que esté primero)
    ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);
    
    // 2. Dibujamos el watermark encima
    ctx.drawImage(watermarkImg, 0, 0, canvas.width, canvas.height);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error al generar blob con marca de agua"));
        },
        "image/jpeg",
        quality
      );
    });
  } catch (err) {
    URL.revokeObjectURL(baseUrl);
    throw err;
  }
}

/**
 * Pipeline completo: comprime + aplica marca de agua.
 */
export async function processPhoto(file, watermarkUrl) {
  const compressed = await compressImage(file);
  if (watermarkUrl) {
    try {
      return await applyWatermark(compressed, watermarkUrl);
    } catch (err) {
      console.error("Fallo al aplicar watermark:", err);
      return compressed;
    }
  }
  return compressed;
}

/**
 * Formatea el tamaño en bytes a string legible (KB / MB).
 */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
