import { Route as ApiRoute } from "@/types";
import type { RouteInfo, RouteStop } from "@/components/app/RouteCard";

export function routeToRouteInfo(r: ApiRoute): RouteInfo {
  const start = r.start_point_details;
  const end = r.end_point_details;
  const stops = (r.stop_points ?? [])
    .sort((a, b) => a.order - b.order)
    .map((sp): RouteStop => ({
      name: sp.place_details?.name ?? "Stop",
      lat: sp.place_details?.latitude ?? 0,
      lng: sp.place_details?.longitude ?? 0,
    }));
  return {
    id: r.id,
    name: r.name,
    startPoint: {
      name: start?.name ?? "Start",
      lat: start?.latitude ?? 0,
      lng: start?.longitude ?? 0,
    },
    endPoint: {
      name: end?.name ?? "End",
      lat: end?.latitude ?? 0,
      lng: end?.longitude ?? 0,
    },
    stops,
  };
}
