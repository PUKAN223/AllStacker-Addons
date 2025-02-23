import CustomEntitySpawned from "./EntitySpawned";
import CustomTick from "./Tick";
import CustomEntityRemoved from "./EntityRemoved";
import CustomEntityDie from "./EntityDie";
import CustomEntityInteract from "./InteractEntity";
export default class CustomEvents {
    constructor(name) {
        this.name = name;
    }
    EntitySpawned(callback) {
        new CustomEntitySpawned(this.name, callback);
    }
    EntityRemoved(callback) {
        new CustomEntityRemoved(this.name, callback);
    }
    EntityDie(callback) {
        new CustomEntityDie(this.name, callback);
    }
    EntityInteract(callback) {
        new CustomEntityInteract(this.name, callback);
    }
    Tick(delay, callback) {
        new CustomTick(this.name, delay, callback);
    }
}
//# sourceMappingURL=CustomEvent.js.map