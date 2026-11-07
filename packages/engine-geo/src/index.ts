/** Coordinate tuple in [longitude, latitude] order (GeoJSON standard) */
export type LngLatTuple = [number, number];

export interface GeoPoint {
    lat: number;
    lng: number;
}

export interface DistanceAndBearingRequest {
    from: GeoPoint;
    to: GeoPoint;
}

export interface DistanceAndBearingResult {
    distanceMeters: number;
    distanceKilometers: number;
    distanceMiles: number;
    distanceFeet: number;
    initialBearingDegrees: number;
    compassDirection: string;
    midpoint: GeoPoint;
}

export interface ParcelMetricsRequest {
    /** Array of [lng, lat] or { lat, lng } vertices forming a polygon */
    coordinates: Array<LngLatTuple | GeoPoint>;
}

export interface BoundingBox {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
}

export interface ParcelMetricsResult {
    vertexCount: number;
    areaSquareMeters: number;
    areaSquareFeet: number;
    areaAcres: number;
    areaHectares: number;
    perimeterMeters: number;
    perimeterFeet: number;
    centroid: GeoPoint;
    boundingBox: BoundingBox;
}

export interface PointInPolygonRequest {
    point: GeoPoint;
    polygon: Array<LngLatTuple | GeoPoint>;
}

export interface PointInPolygonResult {
    inside: boolean;
    distanceToCentroidMeters: number;
}

const EARTH_RADIUS_METERS = 6371008.8;
const SQ_METERS_PER_ACRE = 4046.8564224;
const SQ_METERS_PER_HECTARE = 10000;
const SQ_FEET_PER_SQ_METER = 10.7639104167;
const FEET_PER_METER = 3.280839895;
const METERS_PER_MILE = 1609.344;

function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

function toDegrees(rad: number): number {
    return (rad * 180) / Math.PI;
}

function roundTo(val: number, decimals = 4): number {
    const factor = Math.pow(10, decimals);
    return Math.round((val + Number.EPSILON) * factor) / factor;
}

function normalizePoint(input: LngLatTuple | GeoPoint): GeoPoint {
    if (Array.isArray(input)) {
        if (input.length < 2) {
            throw new Error("Coordinate tuple must contain [lng, lat].");
        }
        const [lng, lat] = input;
        validateLatLng(lat, lng);
        return { lng, lat };
    }
    validateLatLng(input.lat, input.lng);
    return { lat: input.lat, lng: input.lng };
}

function validateLatLng(lat: number, lng: number): void {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Latitude and longitude must be finite numbers.");
    }
    if (lat < -90 || lat > 90) {
        throw new Error(`Latitude ${lat} is out of bounds (-90 to 90).`);
    }
    if (lng < -180 || lng > 180) {
        throw new Error(`Longitude ${lng} is out of bounds (-180 to 180).`);
    }
}

function bearingToCompass(deg: number): string {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
}

export function calculateDistanceAndBearing(
    params: DistanceAndBearingRequest
): DistanceAndBearingResult {
    const from = normalizePoint(params.from);
    const to = normalizePoint(params.to);

    const phi1 = toRadians(from.lat);
    const phi2 = toRadians(to.lat);
    const deltaPhi = toRadians(to.lat - from.lat);
    const deltaLambda = toRadians(to.lng - from.lng);

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = EARTH_RADIUS_METERS * c;

    // Initial bearing
    const y = Math.sin(deltaLambda) * Math.cos(phi2);
    const x =
        Math.cos(phi1) * Math.sin(phi2) -
        Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
    const theta = Math.atan2(y, x);
    const initialBearingDegrees = (toDegrees(theta) + 360) % 360;

    // Spherical midpoint
    const bx = Math.cos(phi2) * Math.cos(deltaLambda);
    const by = Math.cos(phi2) * Math.sin(deltaLambda);
    const midPhi = Math.atan2(
        Math.sin(phi1) + Math.sin(phi2),
        Math.sqrt((Math.cos(phi1) + bx) * (Math.cos(phi1) + bx) + by * by)
    );
    const midLambda = toRadians(from.lng) + Math.atan2(by, Math.cos(phi1) + bx);

    return {
        distanceMeters: roundTo(distanceMeters, 2),
        distanceKilometers: roundTo(distanceMeters / 1000, 4),
        distanceMiles: roundTo(distanceMeters / METERS_PER_MILE, 4),
        distanceFeet: roundTo(distanceMeters * FEET_PER_METER, 2),
        initialBearingDegrees: roundTo(initialBearingDegrees, 2),
        compassDirection: bearingToCompass(initialBearingDegrees),
        midpoint: {
            lat: roundTo(toDegrees(midPhi), 6),
            lng: roundTo(toDegrees(midLambda), 6),
        },
    };
}

export function calculateParcelMetrics(params: ParcelMetricsRequest): ParcelMetricsResult {
    if (!params.coordinates || params.coordinates.length < 3) {
        throw new Error("At least 3 coordinates are required to form a polygon parcel.");
    }

    const points = params.coordinates.map(normalizePoint);

    // Strip duplicate closing vertex if provided so we iterate cleanly
    if (
        points.length > 3 &&
        points[0].lat === points[points.length - 1].lat &&
        points[0].lng === points[points.length - 1].lng
    ) {
        points.pop();
    }

    if (points.length < 3) {
        throw new Error("At least 3 distinct vertices are required to calculate parcel area.");
    }

    // Spherical polygon excess formula for geodesic area on Earth
    let areaAccumulator = 0;
    let perimeterMeters = 0;
    let minLng = Infinity;
    let minLat = Infinity;
    let maxLng = -Infinity;
    let maxLat = -Infinity;
    let sumLat = 0;
    let sumLng = 0;

    const n = points.length;
    for (let i = 0; i < n; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % n];

        areaAccumulator +=
            toRadians(p2.lng - p1.lng) *
            (2 + Math.sin(toRadians(p1.lat)) + Math.sin(toRadians(p2.lat)));

        const leg = calculateDistanceAndBearing({ from: p1, to: p2 });
        perimeterMeters += leg.distanceMeters;

        if (p1.lng < minLng) minLng = p1.lng;
        if (p1.lat < minLat) minLat = p1.lat;
        if (p1.lng > maxLng) maxLng = p1.lng;
        if (p1.lat > maxLat) maxLat = p1.lat;

        sumLat += p1.lat;
        sumLng += p1.lng;
    }

    const areaSquareMeters = Math.abs(
        (areaAccumulator * EARTH_RADIUS_METERS * EARTH_RADIUS_METERS) / 2.0
    );

    return {
        vertexCount: n,
        areaSquareMeters: roundTo(areaSquareMeters, 2),
        areaSquareFeet: roundTo(areaSquareMeters * SQ_FEET_PER_SQ_METER, 2),
        areaAcres: roundTo(areaSquareMeters / SQ_METERS_PER_ACRE, 4),
        areaHectares: roundTo(areaSquareMeters / SQ_METERS_PER_HECTARE, 4),
        perimeterMeters: roundTo(perimeterMeters, 2),
        perimeterFeet: roundTo(perimeterMeters * FEET_PER_METER, 2),
        centroid: {
            lat: roundTo(sumLat / n, 6),
            lng: roundTo(sumLng / n, 6),
        },
        boundingBox: {
            minLng: roundTo(minLng, 6),
            minLat: roundTo(minLat, 6),
            maxLng: roundTo(maxLng, 6),
            maxLat: roundTo(maxLat, 6),
        },
    };
}

export function isPointInPolygon(params: PointInPolygonRequest): PointInPolygonResult {
    const pt = normalizePoint(params.point);
    const ring = params.polygon.map(normalizePoint);

    if (ring.length < 3) {
        throw new Error("Polygon must have at least 3 vertices.");
    }

    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i].lng;
        const yi = ring[i].lat;
        const xj = ring[j].lng;
        const yj = ring[j].lat;

        const intersect =
            yi > pt.lat !== yj > pt.lat &&
            pt.lng < ((xj - xi) * (pt.lat - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    const metrics = calculateParcelMetrics({ coordinates: ring });
    const dist = calculateDistanceAndBearing({
        from: pt,
        to: metrics.centroid,
    });

    return {
        inside,
        distanceToCentroidMeters: dist.distanceMeters,
    };
}
