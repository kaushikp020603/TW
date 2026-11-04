/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { createContext, useContext } from "react";

export type Route = "dashboard" | "calendar" | "bookings" | "payments" | "clients" | "services" | "availability" | "coupons" | "cards" | "blog" | "experience" | "notices" | "reviews" | "chat" | "community" | "readers" | "readings" | "reports" | "settings";
export type AdminCtx = {
  d: any;
  act: (body: object, msg?: string) => Promise<any>;
  go: (r: Route) => void;
  reload: () => Promise<void>;
  openBooking: (id: number) => void;
  openClient: (id: number) => void;
};
export const Ctx = createContext<AdminCtx>(null as unknown as AdminCtx);
export const useAdmin = () => useContext(Ctx);
