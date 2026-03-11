type InstanceProps<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K
}[keyof T];

type PrefixedKeys<T, P extends string> = `${P}${Capitalize<InstanceProps<T> & string>}`;

type EventPayload<T> = T extends { subscribe(cb: (arg: infer U) => unknown): unknown } ? U : never;

type EventPayloadMap<T, P extends string> = {
    [K in InstanceProps<T> as `${P}${Capitalize<K & string>}`]: EventPayload<T[K]>
};

export type { EventPayloadMap, PrefixedKeys, InstanceProps, EventPayload };