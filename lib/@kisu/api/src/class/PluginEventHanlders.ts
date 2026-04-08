import { EventHandlers, PluginBase, WorldEvents } from "@kisu/api";

class PluginEventHandlers {
  private plugin: PluginBase;
  private eventHandlers: EventHandlers<WorldEvents>;

  constructor(plugin: PluginBase, eventHandlers: EventHandlers<WorldEvents>) {
    this.plugin = plugin;
    this.eventHandlers = eventHandlers;
  }
  on<K extends `Custom${string}`, T>(
    event: K,
    listener: (payload: T) => void,
  ): void;
  on<T extends keyof WorldEvents>(
    event: T,
    listener: (payload: WorldEvents[T]) => void,
  ): void;
  on(event: unknown, listener: unknown): void {
    this.eventHandlers.on(this.plugin, event as keyof WorldEvents, listener as (payload: unknown) => void);
  }
  emit<K extends `Custom${string}`, T>(event: K, payload: T): void;
  emit<T extends keyof WorldEvents>(event: T, payload: WorldEvents[T]): void;
  emit(event: unknown, payload: unknown): void {
    if (typeof event === 'string' && event.startsWith('Custom')) {
      this.eventHandlers.emit(event as `Custom${string}`, payload);
    } else {
      this.eventHandlers.emit(event as keyof WorldEvents, payload as WorldEvents[keyof WorldEvents]);
    }
  }
}

export { PluginEventHandlers };
