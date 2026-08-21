import type { SystemAfterEvents, SystemBeforeEvents, WorldAfterEvents, WorldBeforeEvents } from "@minecraft/server";
import type { EventPayloadMap } from  "@packages/api/src/types/EventPayloadMap.ts";

type AfterEvents = EventPayloadMap<WorldAfterEvents, "After">;
type BeforeEvents = EventPayloadMap<WorldBeforeEvents, "Before">;
type SAfterEvents = EventPayloadMap<SystemAfterEvents, "After">;
type SBeforeEvents = EventPayloadMap<SystemBeforeEvents, "Before">;

type WorldEvents = AfterEvents & BeforeEvents & SAfterEvents & SBeforeEvents & {
  AfterTick: { currentTick: number };
};

export type { WorldEvents, AfterEvents, BeforeEvents };
