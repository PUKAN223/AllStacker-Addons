// ─── MobStacker › config › ConfigProvider ──────────────────────────────────────

/**
 * Minimal interface required to read MobStacker configuration values.
 * Matches `@axeth/api`'s PluginSettingOptions return type shape.
 */
export interface ConfigProvider {
  config: { get(): Record<string, { value?: unknown }> | null | undefined };
}
