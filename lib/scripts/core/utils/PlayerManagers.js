import { world } from "@minecraft/server";
export function getAllPlayers(filter) {
    const players = world.getAllPlayers();
    if (filter) {
        return players.filter(filter);
    }
    return players;
}
export function getPlayerByName(name) {
    return world.getPlayers().find(player => player.name === name);
}
export function getPlayerById(id) {
    return world.getPlayers().find(player => player.id === id);
}
export function eachPlayers(callback, players) {
    const targetPlayers = players || world.getAllPlayers();
    targetPlayers.forEach(callback);
}
//# sourceMappingURL=PlayerManagers.js.map