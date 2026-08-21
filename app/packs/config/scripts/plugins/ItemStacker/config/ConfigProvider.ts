// ─── ItemStacker › config › ConfigProvider ────────────────────────────────────

/**
 * Minimal interface required to read plugin configuration values.
 *
 * Using a structural interface (instead of importing `PluginBase` directly)
 * avoids circular dependencies: config helpers can be imported by any module
 * without pulling in the entire plugin class.
 *
 * `value` is typed as optional (`value?`) to match the actual
 * `PluginSettingOptions` shape emitted by `@axeth/api`.
 */
export interface ConfigProvider {
  config: { get(): Record<string, { value?: unknown }> | null | undefined };
}
