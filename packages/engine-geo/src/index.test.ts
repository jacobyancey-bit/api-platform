import { describe, it, expect } from "vitest";
import {
    calculateDistanceAndBearing,
    calculateParcelMetrics,
    isPointInPolygon,
    generateWireGuardConfig,
    buildDocScannerSession,
} from "./index.js";

describe("calculateDistanceAndBearing", () => {
    it("calculates accurate distance and bearing between two coordinates", () => {
        // Austin Capitol to Dallas Dealey Plaza
        const res = calculateDistanceAndBearing({
            from: { lat: 30.2747, lng: -97.7404 },
            to: { lat: 32.7787, lng: -96.8089 },
        });

        expect(res.distanceKilometers).toBeGreaterThan(290);
        expect(res.distanceKilometers).toBeLessThan(300);
        expect(res.distanceMiles).toBeGreaterThan(180);
        expect(res.compassDirection).toBe("N");
    });
});

describe("calculateParcelMetrics", () => {
    it("calculates acreage, square feet, perimeter, and centroid for a land parcel", () => {
        // Approx 100m x 100m square near equator (~1 hectare / ~2.471 acres)
        const degPer100m = 100 / 111319.49;
        const result = calculateParcelMetrics({
            coordinates: [
                [0, 0],
                [degPer100m, 0],
                [degPer100m, degPer100m],
                [0, degPer100m],
            ],
        });

        expect(result.vertexCount).toBe(4);
        expect(result.areaHectares).toBeCloseTo(1.0, 1);
        expect(result.areaAcres).toBeCloseTo(2.47, 1);
        expect(result.perimeterMeters).toBeCloseTo(400, 0);
    });
});

describe("isPointInPolygon", () => {
    const parcel: Array<[number, number]> = [
        [-97.75, 30.25],
        [-97.70, 30.25],
        [-97.70, 30.30],
        [-97.75, 30.30],
    ];

    it("detects when a coordinate lies inside or outside a parcel boundary", () => {
        const insideCheck = isPointInPolygon({
            point: { lat: 30.275, lng: -97.725 },
            polygon: parcel,
        });
        expect(insideCheck.inside).toBe(true);
        expect(insideCheck.distanceToCentroidMeters).toBe(0);

        const outsideCheck = isPointInPolygon({
            point: { lat: 30.35, lng: -97.725 },
            polygon: parcel,
        });
        expect(outsideCheck.inside).toBe(false);
    });
});

describe("generateWireGuardConfig & buildDocScannerSession", () => {
    it("generates a deterministic WireGuard client profile and DocScanner deep link", () => {
        const wg = generateWireGuardConfig({
            clientName: "jacob-laptop",
            serverEndpoint: "vpn.dangling-dice-studios.com:51820",
            peerIndex: 12,
        });
        expect(wg.assignedClientIpCidr).toBe("10.66.66.12/32");
        expect(wg.clientConfigFile).toContain("[Interface]");

        const scan = buildDocScannerSession({
            sessionId: "sess_99",
            callbackUrl: "https://dangling-dice-studios.com/api/scanner/upload",
        });
        expect(scan.deepLinkUri).toContain("docscan://scan?session=sess_99");
        expect(scan.standardFormat).toBe("US Letter (8.5 x 11 in)");
    });
});

