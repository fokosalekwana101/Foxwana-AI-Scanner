import type { Analysis, AnalysisMode } from "./foxwana/schema";

export interface Settings {
  mode: AnalysisMode;
  market: string;
  timeframe: string;
  htfTimeframe: string;
  riskPercent: number;
  accountBalance: number | null;
  minRR: number;
}

export const DEFAULT_SETTINGS: Settings = {
  mode: "crt",
  market: "Forex",
  timeframe: "",
  htfTimeframe: "",
  riskPercent: 1,
  accountBalance: null,
  minRR: 1.5,
};

export interface ScanRecord {
  id: string;
  createdAt: number;
  mode: AnalysisMode;
  instrument: string;
  timeframe: string;
  thumb: string; // small JPEG preview only, never the full image
  analysis: Analysis;
  minRR: number;
  hasHtf: boolean;
}

const SK = "foxwana.settings.v1";
const HK = "foxwana.history.v1";

export function loadSettings(): Settings {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SK) ?? "{}") };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
export function saveSettings(s: Settings) {
  localStorage.setItem(SK, JSON.stringify(s));
}
export function loadHistory(): ScanRecord[] {
  try {
    return JSON.parse(localStorage.getItem(HK) ?? "[]");
  } catch {
    return [];
  }
}
export function addScan(r: ScanRecord) {
  const list = [r, ...loadHistory()].slice(0, 50);
  try {
    localStorage.setItem(HK, JSON.stringify(list));
  } catch {
    localStorage.setItem(HK, JSON.stringify(list.slice(0, 10)));
  }
}
export function deleteScan(id: string) {
  localStorage.setItem(HK, JSON.stringify(loadHistory().filter((r) => r.id !== id)));
}
export function clearHistory() {
  localStorage.removeItem(HK);
}

const TYPES = ["image/png", "image/jpeg", "image/webp"];
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export function validateFile(f: File): string | null {
  if (!TYPES.includes(f.type)) return "Use a PNG, JPG or WEBP screenshot.";
  if (f.size > MAX_FILE_BYTES) return "Image is larger than 10 MB.";
  return null;
}

/** Downscale for upload (max edge) and return a data URL. */
export async function fileToDataUrl(f: File, maxEdge = 1800, quality = 0.9, type = "image/jpeg"): Promise<string> {
  const url = URL.createObjectURL(f);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = () => rej(new Error("This file could not be read as an image."));
      i.src = url;
    });
    const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL(type, quality);
  } finally {
    URL.revokeObjectURL(url);
  }
}
