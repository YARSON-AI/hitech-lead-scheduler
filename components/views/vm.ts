import type { CSSProperties } from "react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type VM = Record<string, any>;

export function css(value: string | CSSProperties | null | undefined): CSSProperties | undefined {
  if (!value) return undefined;
  if (typeof value !== "string") return value;
  const style: Record<string, string> = {};
  for (const declaration of value.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;
    const key = declaration.slice(0, colon).trim();
    const name = key.startsWith("--") ? key : key.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[name] = declaration.slice(colon + 1).trim();
  }
  return style as CSSProperties;
}
