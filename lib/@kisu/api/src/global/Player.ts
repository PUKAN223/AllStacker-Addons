// import { Player } from "npm:@minecraft/server@2.3.0";

// declare global {
//   interface Player {
//     sendToast(title?: string, message?: string, icon?: string, background?: string): void;
//   }
// }

// function adjustTextLength(text = "", totalLength = 100) {
//   return (text.slice(0, totalLength)).padEnd(totalLength, "\t");
// }

// Player.prototype.sendToast = function (title: string = "", message: string = "", icon: string = "", background: string = "textures/ui/greyBorder"): void {
//   const text = "§N§O§T§I§F§I§C§A§T§I§O§N" + adjustTextLength(title, 100) + adjustTextLength(message, 200) + adjustTextLength(icon, 100) + adjustTextLength(background, 100)
//   this.sendMessage(text);
//   return;
// };
