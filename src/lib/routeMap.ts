import { Route as ApiRoute } from "@/types";
import type { RouteInfo, RouteStop } from "@/components/app/RouteCard";

function toNum(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isNaN(n) ? 0 : n;
}

export function routeToRouteInfo(r: ApiRoute): RouteInfo {
  const start = r.start_point_details;
  const end = r.end_point_details;
  const stops = (r.stop_points ?? [])
    .sort((a, b) => a.order - b.order)
    .map((sp): RouteStop => ({
      name: sp.place_details?.name ?? "Stop",
      lat: toNum(sp.place_details?.latitude),
      lng: toNum(sp.place_details?.longitude),
    }));
  return {
    id: r.id,
    name: r.name,
    startPoint: {
      name: start?.name ?? "Start",
      lat: toNum(start?.latitude),
      lng: toNum(start?.longitude),
    },
    endPoint: {
      name: end?.name ?? "End",
      lat: toNum(end?.latitude),
      lng: toNum(end?.longitude),
    },
    stops,
  };
}
