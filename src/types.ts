import type { Timestamp } from "firebase/firestore";
export type Role = "member" | "spotter_mod" | "camilo_owner";
export interface Profile {
  id: string;
  displayName: string;
  photoURL: string;
  email: string;
  role: Role;
  rpmPoints: number;
  badges: string[];
  socials?: { instagram?: string; youtube?: string; tiktok?: string };
}
export interface Trivia {
  id: string;
  question: string;
  prize: string;
  status: "active" | "closed";
  expiresAt: Timestamp;
}
export interface Submission {
  id: string;
  uid: string;
  displayName: string;
  answer: string;
  submittedAt: Timestamp;
  awarded?: boolean;
  delivered?: boolean;
  accepted?: boolean;
}
export interface Meet {
  id: string;
  title: string;
  date: Timestamp;
  location: string;
  mapUrl: string;
  description: string;
  mode: "open" | "limited" | "raffle";
  capacity: number;
  confirmedCount: number;
  raffleDrawn: boolean;
  raffleLocked?: boolean;
}
export interface Registration {
  id: string;
  uid: string;
  displayName: string;
  status: "waitlist" | "confirmed";
  checkedIn: boolean;
  token: string;
  createdAt: Timestamp;
}
export interface Post {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  exclusiveUntil: Timestamp;
}
export interface Comment {
  id: string;
  uid: string;
  displayName: string;
  text: string;
}
export interface Item {
  id: string;
  title: string;
  category: "merch" | "autos" | "piezas";
  image: string;
  description: string;
  price: number;
  stock: Record<string, number>;
  paymentUrl: string;
  active: boolean;
}
export interface Ticket {
  id: string;
  uid: string;
  displayName: string;
  question: string;
  answer: string;
  status: "open" | "resolved";
  resolvedAt?: Timestamp;
}
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
export const level = (rpm: number) =>
  rpm >= 8000
    ? "Redline Club VIP"
    : rpm >= 5000
      ? "Track Ready"
      : rpm >= 2000
        ? "Street Spec"
        : "Ralentí";
export const money = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(n);
export function safeUrl(s: string): string {
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}
