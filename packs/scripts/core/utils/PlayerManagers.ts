import { Player, world } from "npm:@minecraft/server-ui@2.0.0";

export function getAllPlayers(filter?: (player: Player) => boolean) {
  const players = world.getAllPlayers();
  if (filter) {
    return players.filter(filter);
  }
  return players;
}

export function getPlayerByName(name: string): Player | undefined {
  return world.getPlayers().find((player) => player.name === name);
}

export function getPlayerById(id: string): Player | undefined {
  return world.getPlayers().find((player) => player.id === id);
}

export function eachPlayers(
  callback: (player: Player) => void,
  players?: Player[],
): void {
  const targetPlayers = players || world.getAllPlayers();
  targetPlayers.forEach(callback);
}
