import inside from "point-in-polygon";

export function getRandomPointInState(feature) {
  const polygons = [];

  if (feature.geometry.type === "Polygon") {
    polygons.push(feature.geometry.coordinates[0]);
  } else if (feature.geometry.type === "MultiPolygon") {
    // Pick polygons by area (approximate) to favor the mainland
    for (const poly of feature.geometry.coordinates) {
      polygons.push(poly[0]);
    }
  }

  // Try the largest polygon first (by bounding box area as proxy)
  polygons.sort((a, b) => {
    const bboxArea = (ring) => {
      const lngs = ring.map((p) => p[0]);
      const lats = ring.map((p) => p[1]);
      return (
        (Math.max(...lngs) - Math.min(...lngs)) *
        (Math.max(...lats) - Math.min(...lats))
      );
    };
    return bboxArea(b) - bboxArea(a);
  });

  const ring = polygons[0];
  const lngs = ring.map((p) => p[0]);
  const lats = ring.map((p) => p[1]);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  // Shrink bounds by 10% to avoid edges
  const padLng = (maxLng - minLng) * 0.1;
  const padLat = (maxLat - minLat) * 0.1;

  for (let attempt = 0; attempt < 1000; attempt++) {
    const lng = minLng + padLng + Math.random() * (maxLng - minLng - 2 * padLng);
    const lat = minLat + padLat + Math.random() * (maxLat - minLat - 2 * padLat);

    // Check against all polygons of this feature
    for (const poly of polygons) {
      if (inside([lng, lat], poly)) {
        return [lng, lat];
      }
    }
  }

  // Fallback: centroid approximation
  const centroidLng = (minLng + maxLng) / 2;
  const centroidLat = (minLat + maxLat) / 2;
  return [centroidLng, centroidLat];
}
