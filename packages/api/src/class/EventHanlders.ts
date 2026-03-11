import type { PluginBase } from "./PluginBase.ts";
import { system } from "@minecraft/server";

type Callback<T> = (payload: T) => void;
type Listener = { owner?: PluginBase; cb: Callback<unknown> };

export class EventHandlers<AutoEvents extends Record<string, unknown>> {
  private autoListeners = new Map<keyof AutoEvents, Listener[]>();
  private customListeners = new Map<string, Listener[]>();
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

    const keep: Listener[] = [];
    list.forEach((l) => {
      const ownedMatch = owner && l.owner === owner;
      const cbMatch = callback && l.cb === callback;

      if (ownedMatch || cbMatch) {
        return;
      }

      keep.push(l);
    });

    listeners.set(event, keep);

    // Unsubscribe from event if no listeners remain
    if (keep.length === 0 && this.onUnsubscribe && !event.startsWith("Custom")) {
      system.run(() => this.onUnsubscribe!(event));
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
      listener.cb(payload);
    } catch {
      // Swallow listener errors to avoid breaking emit loop
    }
  }

  public suspendPlugin(owner: PluginBase): Map<string, Callback<unknown>[]> {
    const stored = new Map<string, Callback<unknown>[]>();

    const collect = (listeners: Map<string, Listener[]>) => {
      for (const [event, list] of listeners.entries()) {
        const owned = list.filter((listener) => listener.owner === owner);
        if (owned.length === 0) continue;

        stored.set(event as string, owned.map((listener) => listener.cb));
        this.removeListener(event as string, owner);
      }
    };

    collect(this.autoListeners as Map<string, Listener[]>);
    collect(this.customListeners);

    return stored;
  }

  public resumePlugin(owner: PluginBase, listeners: Map<string, Callback<unknown>[]>): void {
    for (const [event, callbacks] of listeners.entries()) {
      for (const cb of callbacks) {
        this.addListener(event, cb, owner);
      }
    }
  }

  private getListenerMap(event: string): Map<string, Listener[]> {
    return event.startsWith("Custom") ? this.customListeners : this.autoListeners as Map<string, Listener[]>;
  }
}
