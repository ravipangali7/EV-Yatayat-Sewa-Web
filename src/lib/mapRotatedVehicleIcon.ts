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

export function makeRotatedVehicleIcon(
  img: HTMLImageElement,
  headingDeg: number,
  width: number,
  height: number,
  anchorX: number,
  anchorY: number
): google.maps.Icon {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return makePlainVehicleIcon(img.src, width, height, anchorX, anchorY);
  }
  ctx.clearRect(0, 0, width, height);
  ctx.translate(width / 2, height / 2);
  ctx.rotate(headingDeg * RAD);
  ctx.drawImage(img, -width / 2, -height / 2, width, height);
  return {
    url: canvas.toDataURL(),
    scaledSize: new google.maps.Size(width, height),
    anchor: new google.maps.Point(anchorX, anchorY),
  };
}

/** Returns true when rotation should be re-rendered (throttle canvas work). */
export function shouldRefreshVehicleIconRotation(prevDeg: number | null, nextDeg: number, stepDeg = 3): boolean {
  if (prevDeg === null) return true;
  const a = ((nextDeg - prevDeg + 540) % 360) - 180;
  return Math.abs(a) >= stepDeg;
}
