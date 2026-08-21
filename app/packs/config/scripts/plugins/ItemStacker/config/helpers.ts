// ─── ItemStacker › config › helpers ───────────────────────────────────────────

import type { ConfigProvider } from "./ConfigProvider.ts";

/**
 * Retrieves a numeric configuration value.
 * Falls back to `def` if the key is missing or not a number.
 */
export function getCfgNum(
  plugin: ConfigProvider,
  key: string,
  def: number,
): number {
  const v = plugin.config.get()?.[key]?.value;
  return typeof v === "number" ? v : def;
}

/**
 * Retrieves a boolean configuration value.
 * Falls back to `def` if the key is missing or not a boolean.
 */
export function getCfgBool(
  plugin: ConfigProvider,
  key: string,
  def: boolean,
): boolean {
  const v = plugin.config.get()?.[key]?.value;
  return typeof v === "boolean" ? v : def;
}

/**
 * Retrieves a string configuration value.
 * Falls back to `def` if the key is missing or not a string.
 */
export function getCfgStr(
  plugin: ConfigProvider,
  key: string,
  def: string,
): string {
  const v = plugin.config.get()?.[key]?.value;
  return typeof v === "string" ? v : def;
}

/**
 * Retrieves an array of strings configuration value.
 * If the config value is a comma-separated string, it splits and trims it.
 * Falls back to an empty array if invalid.
 */
export function getCfgArr(plugin: ConfigProvider, key: string): string[] {
  const v = plugin.config.get()?.[key]?.value;
  if (typeof v === "string") {
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return Array.isArray(v) ? (v as string[]) : [];
}
