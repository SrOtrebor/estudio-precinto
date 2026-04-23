// Utilidad de compresión y marca de agua — todo en el navegador del invitado
// Sin backend, sin costo adicional

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.82;

/**
 * Carga una imagen desde un File y la dibuja en un canvas.
 * Redimensiona si supera maxWidth manteniendo la proporción.
 * Retorna un Blob JPEG comprimido (~200-350KB típico).
 */
export async function compressImage(file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
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

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error al comprimir la imagen"));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Error al cargar la imagen"));
    img.src = url;
  });
}

/**
 * Superpone un PNG de marca de agua sobre la imagen ya comprimida.
 * El watermarkUrl puede ser una URL de Storage o un import local.
 * Retorna un Blob JPEG con la marca de agua aplicada.
 */
export async function applyWatermark(imageBlob, watermarkUrl, quality = DEFAULT_QUALITY) {
  return new Promise((resolve, reject) => {
    const baseImg = new Image();
    const watermarkImg = new Image();
    watermarkImg.crossOrigin = "anonymous";

    const baseUrl = URL.createObjectURL(imageBlob);

    baseImg.onload = () => {
      URL.revokeObjectURL(baseUrl);

      watermarkImg.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = baseImg.width;
        canvas.height = baseImg.height;

        const ctx = canvas.getContext("2d");

        // Dibujamos la foto base
        ctx.drawImage(baseImg, 0, 0);

        // Superponemos la marca de agua escalada al tamaño de la imagen
        ctx.drawImage(watermarkImg, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Error al aplicar la marca de agua"));
          },
          "image/jpeg",
          quality
        );
      };

      watermarkImg.onerror = () => {
        // Si falla la marca de agua, devolvemos la imagen sin marca
        console.warn("No se pudo cargar la marca de agua, se sube sin ella.");
        resolve(imageBlob);
      };

      watermarkImg.src = watermarkUrl;
    };

    baseImg.onerror = () => reject(new Error("Error al procesar la imagen base"));
    baseImg.src = baseUrl;
  });
}

/**
 * Pipeline completo: comprime + aplica marca de agua.
 * Devuelve el Blob final listo para subir a Firebase Storage.
 */
export async function processPhoto(file, watermarkUrl) {
  const compressed = await compressImage(file);
  if (watermarkUrl) {
    return applyWatermark(compressed, watermarkUrl);
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
