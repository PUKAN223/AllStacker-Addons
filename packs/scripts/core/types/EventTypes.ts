// minecraft-event-types.ts

import {
    WorldBeforeEvents,
    WorldAfterEvents,
} from 'npm:@minecraft/server@2.3.0';

type ExtractEventNames<T> = {
    [K in keyof T]: K extends string ? K : never;
}[keyof T];
type BeforeEventNames = ExtractEventNames<WorldBeforeEvents>;
type AfterEventNames = ExtractEventNames<WorldAfterEvents>;

type BeforeEventKey = `before:${BeforeEventNames}`;
type AfterEventKey = `after:${AfterEventNames}`;

export type EventKey = BeforeEventKey | AfterEventKey;

export type TickEventCallback = (event: { currentTick: number }) => void;

export type EventCallbackMap = {
    [K in BeforeEventKey]: K extends `before:${infer N}`
        ? N extends BeforeEventNames 
            ? (event: WorldBeforeEvents[N]) => void
            : never
        : never;
} & {
    [K in AfterEventKey]: K extends `after:${infer N}`
        ? N extends AfterEventNames
            ? (event: WorldAfterEvents[N]) => void
            : never
        : never;
} & {
    [K in `after:tick`]: (event: { currentTick: number }) => void;
} & {
    // deno-lint-ignore no-explicit-any
    [K in `custom:${string}`]: (event: any) => void;
};