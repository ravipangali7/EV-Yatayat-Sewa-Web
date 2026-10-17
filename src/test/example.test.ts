import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { routeToRouteInfo } from "@/lib/routeMap";
import { transactionToAppTransaction } from "@/lib/transactionMap";
import type { Route, Transaction } from "@/types";

describe("Luna IoT Regression Suite (A1, A2, B1, B2, B3, C1, C2)", () => {
  it("A1: maps credit and debit wallet transactions accurately with remarks and amounts", () => {
    const creditTx: Transaction = {
      id: "101",
      wallet: "1",
      user: "2",
      status: "success",
      balance_before: 100,
      balance_after: 350,
      amount: 250,
      type: "add",
      remarks: "Admin wallet credit",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const debitTx: Transaction = {
      id: "102",
      wallet: "1",
      user: "2",
      status: "success",
      balance_before: 350,
      balance_after: 200,
      amount: 150,
      type: "deducted",
      remarks: "Admin wallet deduction",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const mappedCredit = transactionToAppTransaction(creditTx);
    const mappedDebit = transactionToAppTransaction(debitTx);

    expect(mappedCredit.type).toBe("credit");
    expect(mappedCredit.amount).toBe(250);
    expect(mappedCredit.title).toBe("Admin wallet credit");

    expect(mappedDebit.type).toBe("debit");
    expect(mappedDebit.amount).toBe(150);
    expect(mappedDebit.title).toBe("Admin wallet deduction");
  });

  it("B1: routeToRouteInfo preserves start point, ordered stops, and end point for active trips", () => {
    const apiRoute: Route = {
      id: "route-1",
      name: "Ratnapark - Suryabinayak",
      is_bidirectional: true,
      start_point: "p1",
      start_point_details: {
        id: "p1",
        name: "Ratnapark",
        code: "RTP",
        latitude: 27.706,
        longitude: 85.315,
        created_at: "",
        updated_at: "",
      },
      end_point: "p3",
      end_point_details: {
        id: "p3",
        name: "Suryabinayak",
        code: "SRB",
        latitude: 27.669,
        longitude: 85.432,
        created_at: "",
        updated_at: "",
      },
      stop_points: [
        {
          id: "sp2",
          route: "route-1",
          place: "p2b",
          order: 2,
          place_details: {
            id: "p2b",
            name: "Thimi",
            code: "THM",
            latitude: 27.679,
            longitude: 85.38,
            created_at: "",
            updated_at: "",
          },
        },
        {
          id: "sp1",
          route: "route-1",
          place: "p2a",
          order: 1,
          place_details: {
            id: "p2a",
            name: "Koteshwor",
            code: "KTS",
            latitude: 27.678,
            longitude: 85.349,
            created_at: "",
            updated_at: "",
          },
        },
      ],
      created_at: "",
      updated_at: "",
    };

    const routeInfo = routeToRouteInfo(apiRoute);
    expect(routeInfo.name).toBe("Ratnapark - Suryabinayak");
    expect(routeInfo.startPoint.name).toBe("Ratnapark");
    expect(routeInfo.endPoint.name).toBe("Suryabinayak");
    expect(routeInfo.stops.map((s) => s.name)).toEqual(["Koteshwor", "Thimi"]);
  });

  it("B2: DriverNavigationMap preserves stop markers without rendering blue connecting Polyline", () => {
    const driverMapSource = fs.readFileSync(
      path.resolve(__dirname, "../components/app/DriverNavigationMap.tsx"),
      "utf-8"
    );
    expect(driverMapSource).not.toMatch(/<Polyline[\s>]/);
    expect(driverMapSource).toContain("MARKER_ICONS[marker.type]");
    expect(driverMapSource).toContain("routeMarkers.map");
  });

  it("B1 & B3: Driver Vehicle screen keeps active route visible during trip_started and preserves is_paid on out-of-range checkout", () => {
    const vehicleSource = fs.readFileSync(
      path.resolve(__dirname, "../pages/app/driver/Vehicle.tsx"),
      "utf-8"
    );
    expect(vehicleSource).toContain("activeRouteInfo");
    expect(vehicleSource).toContain("is_paid: item.is_paid");
  });

  it("C1 & C2: Passenger UserTrackTrip renders planned route polyline and uses stable mapInitialCenterRef without jumping to path[0]", () => {
    const trackTripSource = fs.readFileSync(
      path.resolve(__dirname, "../pages/app/user/UserTrackTrip.tsx"),
      "utf-8"
    );
    expect(trackTripSource).toContain("mapInitialCenterRef");
    expect(trackTripSource).toContain("plannedRoutePath");
    expect(trackTripSource).toContain("programmaticCameraRef");
    expect(trackTripSource).not.toContain("const initialCenter = path.length ? path[0]");
  });
});

