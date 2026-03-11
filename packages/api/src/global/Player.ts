import { type Player, system, world } from "@minecraft/server";

enum MessageType {
  Toast = "toast",
  Topbar = "topbar",
  BottomBar = "bottombar",
  Ui = "ui",
}

interface QueueItem {
  type: MessageType;
  message: string;
  data?: {
    title?: string;
    icon?: string;
    background?: string;
  };
}

const messageQueues = new Map<string, QueueItem[]>();
let runnerStarted = false;

function adjustTextLength(text = "", totalLength = 100): string {
  return text.slice(0, totalLength).padEnd(totalLength, "\t");
}

function getQueue(playerId: string): QueueItem[] {
  let q = messageQueues.get(playerId);
  if (!q) {
    q = [];
    messageQueues.set(playerId, q);
  }
  return q;
}

function buildToastText(message: string, data?: QueueItem["data"]): string {
  return (
    "§N§O§T§I§F§I§C§A§T§I§O§N" +
    adjustTextLength(data?.title, 100) +
    adjustTextLength("§7" + message, 600) +
    adjustTextLength(data?.icon, 200) +
    adjustTextLength(data?.background, 200)
  );
}

function startRunner() {
  if (runnerStarted) return;
  runnerStarted = true;

  system.runInterval(() => {
    for (const [playerId, queue] of messageQueues) {
      if (queue.length === 0) continue;

      const pl = world.getAllPlayers().find((p) => p.id === playerId);
      if (!pl) {
        messageQueues.delete(playerId);
        continue;
      }

      const displayOptions = {
        fadeInDuration: 0,
        stayDuration: 0,
        fadeOutDuration: 0,
      };

      const item = queue.shift()!;
      if (item.type === MessageType.Toast) {
        pl.sendMessage(buildToastText(item.message, item.data));
        pl.playSound("note.harp", { volume: 0.6, pitch: 1.5 });
      } else if (item.type === MessageType.Topbar) {
        pl.onScreenDisplay.setTitle("§m§c" + item.message, displayOptions);
      } else if (item.type === MessageType.BottomBar) {
        pl.onScreenDisplay.setTitle("§m§e" + item.message, displayOptions);
      } else if (item.type === MessageType.Ui) {
        pl.onScreenDisplay.setTitle(item.message, displayOptions);
      }
    }
  }, 1);
}

class PlayerUtils {
  static sendToast(
    pl: Player,
    title = "",
    message = "",
    icon = "",
    background = "textures/ui/greyBorder",
  ): void {
    startRunner();
    getQueue(pl.id).push({
      type: MessageType.Toast,
      message,
      data: { title, icon, background },
    });
  }

  static sendTopbar(pl: Player, message: string): void {
    startRunner();
    getQueue(pl.id).push({ type: MessageType.Topbar, message });
  }

  static stopTopbar(pl: Player): void {
    startRunner();
    getQueue(pl.id).push({ type: MessageType.Topbar, message: "" });
  }

  static sendBottomBar(pl: Player, message: string): void {
    startRunner();
    getQueue(pl.id).push({ type: MessageType.BottomBar, message });
  }

  static stopBottomBar(pl: Player): void {
    startRunner();
    getQueue(pl.id).push({ type: MessageType.BottomBar, message: "" });
  }

  static sendUi(pl: Player, message: string): void {
    startRunner();
    getQueue(pl.id).push({ type: MessageType.Ui, message });
  }
}

export { MessageType, PlayerUtils };
