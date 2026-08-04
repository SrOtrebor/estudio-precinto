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
 * Pipeline de paso único: carga la foto original y genera el archivo comprimido.
 * Ya no aplica marca de agua por código para favorecer el diseño dinámico en el monitor.
 */
export async function processPhoto(file, watermarkUrl) {
  const photoUrl = URL.createObjectURL(file);
  
  try {
    const img = await loadImage(photoUrl);
    URL.revokeObjectURL(photoUrl);

    // Calculamos dimensiones finales
    let { width, height } = img;
    const maxWidth = DEFAULT_MAX_WIDTH;
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // Dibujamos la FOTO
    ctx.drawImage(img, 0, 0, width, height);

    // Generamos el Blob final
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Error al generar el archivo final"));
        },
        "image/jpeg",
        DEFAULT_QUALITY
      );
    });

  } catch (err) {
    URL.revokeObjectURL(photoUrl);
    console.error("Error en el procesador de imagen:", err);
    return file; 
  }
}

/**
 * Mantenemos estas para compatibilidad si se usan por separado, 
 * pero el flujo principal ahora usa processPhoto simplificado.
 */
export async function compressImage(file, maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY) {
  return processPhoto(file, null);
}

export async function applyWatermark(imageBlob, watermarkUrl, quality = DEFAULT_QUALITY) {
  return processPhoto(imageBlob, watermarkUrl);
}

/**
 * Formatea el tamaño en bytes a string legible (KB / MB).
 */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
