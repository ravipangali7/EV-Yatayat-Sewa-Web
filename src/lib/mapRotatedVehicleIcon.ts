/** Build map marker icons from the vehicle PNG; rotated variant uses canvas (same-origin assets only). */

const RAD = Math.PI / 180;

const imageCache = new Map<string, Promise<HTMLImageElement>>();

export function loadVehicleMarkerImage(url: string): Promise<HTMLImageElement> {
  let p = imageCache.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Failed to load marker image: ${url}`));
      img.src = url;
    });
    imageCache.set(url, p);
  }
  return p;
}

export function makePlainVehicleIcon(
  imageUrl: string,
  width: number,
  height: number,
  anchorX: number,
  anchorY: number
): google.maps.Icon {
  return {
    url: imageUrl,
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(anchorX, anchorY),
  };
}

/** Extra px on each side so rotated edges are not clipped by subpixel/antialiasing. */
const ROTATED_ICON_PAD = 2;

export function makeRotatedVehicleIcon(
  img: HTMLImageElement,
  headingDeg: number,
  width: number,
  height: number,
  _anchorX: number,
  _anchorY: number
): google.maps.Icon {
  const rad = headingDeg * RAD;
  const c = Math.abs(Math.cos(rad));
  const s = Math.abs(Math.sin(rad));
  const boundW = width * c + height * s;
  const boundH = width * s + height * c;
  const cw = Math.ceil(boundW) + ROTATED_ICON_PAD * 2;
  const ch = Math.ceil(boundH) + ROTATED_ICON_PAD * 2;

  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return makePlainVehicleIcon(img.src, width, height, _anchorX, _anchorY);
  }
  ctx.clearRect(0, 0, cw, ch);
  ctx.translate(cw / 2, ch / 2);
  ctx.rotate(rad);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(cw, ch),
    anchor: new google.maps.Point(cw / 2, ch / 2),
  };
}

/** Returns true when rotation should be re-rendered (throttle canvas work). */
export function shouldRefreshVehicleIconRotation(prevDeg: number | null, nextDeg: number, stepDeg = 3): boolean {
  if (prevDeg === null) return true;
  const a = ((nextDeg - prevDeg + 540) % 360) - 180;
  return Math.abs(a) >= stepDeg;
}
