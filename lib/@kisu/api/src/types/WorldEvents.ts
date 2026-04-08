import { SystemAfterEvents, SystemBeforeEvents, WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";
import { EventPayloadMap } from "./EventPayloadMap.ts";

const _WorldAfterInstance: WorldAfterEvents = {} as WorldAfterEvents;
const _WorldBeforeInstance: WorldBeforeEvents = {} as WorldBeforeEvents;
const _SystemAfterInstance: SystemAfterEvents = {} as SystemAfterEvents;
const _SystemBeforeInstance: SystemBeforeEvents = {} as SystemBeforeEvents;

type AfterEvents = EventPayloadMap<typeof _WorldAfterInstance, "After">;
type BeforeEvents = EventPayloadMap<typeof _WorldBeforeInstance, "Before">;
type SAfterEvents = EventPayloadMap<typeof _SystemAfterInstance, "After">;
type SBeforeEvents = EventPayloadMap<typeof _SystemBeforeInstance, "Before">;

type WorldEvents = AfterEvents & BeforeEvents & SAfterEvents & SBeforeEvents & {
  AfterTick: { currentTick: number };
};

export type { WorldEvents, AfterEvents, BeforeEvents };
