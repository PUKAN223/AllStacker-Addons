import { PluginBase } from "@kisu/api";

type Callback<T> = (payload: T) => void;
type Listener = { owner?: PluginBase; cb: Callback<unknown> };
type SubscriptionCallback = () => void;

export class EventHandlers<AutoEvents extends Record<string, unknown>> {
  private autoListeners = new Map<keyof AutoEvents, Listener[]>();
  private customListeners = new Map<string, Listener[]>();
  private subscriptions = new Map<string, SubscriptionCallback>();
  private onSubscribe?: (event: string) => void;
  private onUnsubscribe?: (event: string) => void;

  /** Set callbacks for dynamic subscription management */
  public setSubscriptionHandlers(
    onSubscribe: (event: string) => void,
    onUnsubscribe: (event: string) => void
  ): void {
    this.onSubscribe = onSubscribe;
    this.onUnsubscribe = onUnsubscribe;
  }

  /** Check if an event has any listeners */
  public hasListeners(event: string): boolean {
    const listeners = this.getListenerMap(event);
    const list = listeners.get(event);
    return list !== undefined && list.length > 0;
  }

  /** Subscribe to events */
  public on<K extends keyof AutoEvents>(event: K, callback: Callback<AutoEvents[K]>): void;
  public on<K extends `Custom${string}`, T>(event: K, callback: Callback<T>): void;
  public on<K extends keyof AutoEvents>(owner: PluginBase, event: K, callback: Callback<AutoEvents[K]>): void;
  public on(...args: unknown[]): void {
    if (typeof args[0] === "string") {
      this.addListener(args[0], args[1] as Callback<unknown>);
    } else {
      this.addListener(args[1] as string, args[2] as Callback<unknown>, args[0] as PluginBase);
    }
  }

  private addListener(event: string, callback: Callback<unknown>, owner?: PluginBase): void {
    const listeners = this.getListenerMap(event);
    const hadListeners = this.hasListeners(event);
    
    const list = listeners.get(event) ?? [];
    list.push({ owner, cb: callback });
    listeners.set(event, list);

    // Subscribe to event if this is the first listener
    if (!hadListeners && this.onSubscribe && !event.startsWith("Custom")) {
      this.onSubscribe(event);
    }
  }

  /** Unsubscribe */
  public off<K extends keyof AutoEvents | `Custom${string}`>(event: K, callback: Callback<unknown>): void;
  public off(owner: PluginBase, event: string, callback?: Callback<unknown>): void;
  public off(...args: unknown[]): void {
    if (typeof args[0] === "string") {
      this.removeListener(args[0], undefined, args[1] as Callback<unknown>);
    } else {
      this.removeListener(args[1] as string, args[0] as PluginBase, args[2] as Callback<unknown> | undefined);
    }
  }

  private removeListener(event: string, owner?: PluginBase, callback?: Callback<unknown>): void {
    const listeners = this.getListenerMap(event);
    const list = listeners.get(event);
    if (!list) return;

    const filtered = owner !== undefined
      ? callback !== undefined
        ? list.filter(l => !(l.owner === owner && l.cb === callback))
        : list.filter(l => l.owner !== owner)
      : list.filter(l => l.cb !== callback);

    listeners.set(event, filtered);

    // Unsubscribe from event if no listeners remain
    if (filtered.length === 0 && this.onUnsubscribe && !event.startsWith("Custom")) {
      this.onUnsubscribe(event);
    }
  }

  /** Emit */
  public emit<K extends keyof AutoEvents>(event: K, payload: AutoEvents[K]): void;
  public emit<K extends `Custom${string}`, T>(event: K, payload: T): void;
  public emit(event: string, payload: unknown): void {
    const listeners = this.getListenerMap(event);
    const list = listeners.get(event);
    if (!list) return;

    for (const listener of list) {
      this.executeListener(listener, payload);
    }
  }

  private executeListener(listener: Listener, payload: unknown): void {
    try {
      if (listener.owner && !listener.owner.isEnabled()) {
        return;
      }
      listener.cb(payload);
    } catch {
      // Swallow listener errors to avoid breaking emit loop
    }
  }

  private getListenerMap(event: string): Map<string, Listener[]> {
    return event.startsWith("Custom") ? this.customListeners : this.autoListeners as Map<string, Listener[]>;
  }
}
