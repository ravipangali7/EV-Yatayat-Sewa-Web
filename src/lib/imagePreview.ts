/**
 * Create a data URL for image preview. Use instead of URL.createObjectURL(file)
 * so that CSP img-src 'self' data: https: allows the preview (blob: is often blocked).
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
