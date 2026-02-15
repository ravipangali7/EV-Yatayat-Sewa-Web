/**
 * Get a road-following path between waypoints using Google Directions API.
 * Returns decoded path or null on failure.
 */
export async function getDirectionsPath(
  waypoints: Array<{ lat: number; lng: number }>
): Promise<Array<{ lat: number; lng: number }> | null> {
  if (typeof google === "undefined" || !google.maps?.DirectionsService) {
    return null;
  }
  if (waypoints.length < 2) return null;

  const origin = waypoints[0];
  const destination = waypoints[waypoints.length - 1];
  const middle = waypoints.slice(1, -1);
  const waypointsParam = middle.slice(0, 25).map(
    (wp) => ({ location: new google.maps.LatLng(wp.lat, wp.lng), stopover: true } as google.maps.DirectionsWaypoint)
  );

  const service = new google.maps.DirectionsService();
  return new Promise((resolve) => {
    service.route(
      {
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypointsParam,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status !== google.maps.DirectionsStatus.OK || !result?.routes?.[0]?.overview_path) {
          resolve(null);
          return;
        }
        const route = result.routes[0];
        const path = route.overview_path;
        const decoded = path.map((p) => ({ lat: p.lat(), lng: p.lng() }));
        resolve(decoded);
      }
    );
  });
}
