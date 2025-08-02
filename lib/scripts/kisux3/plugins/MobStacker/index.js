import { EntityDamageCause, EntityEquippableComponent, EntityProjectileComponent, EquipmentSlot, system, world } from "@minecraft/server";
import { JsonDatabase, KXEvents, PluginBase } from "../../../core";
import { EntityToName, getMobColorCode, spawnEntityClone, StackingMob } from "./services/utils";
import IActionForm from "../../../core/class/forms/IActionForm";
import IModalForm from "../../../core/class/forms/IModalForm";
import { PluginLoader } from "../../configs/PluginLoader";
import ConfigMenu from "../ConfigMenu";
import { LanguageContext } from "../../configs/Lang";
const IdToName = (mob) => {
    return mob.split(":")[1]
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
};
class MobStacker extends PluginBase {
    constructor() {
        super(...arguments);
        this.config = {};
    }
    onLoad(ev) {
        this.initializeConfig();
        this.runJobs();
        KXEvents.on(this, "after:entityDie", (ev) => {
            this.onEntityDie(ev);
        });
        KXEvents.on(this, "before:playerInteractWithEntity", (ev) => {
            this.onEntityInteract(ev);
        });
        KXEvents.on(this, "before:entityRemove", (ev) => {
            this.onXpDrop(ev);
        });
    }
    ;
    onShutdown(ev) { }
    ;
    onStartup(ev) { }
    ;
    onXpDrop(ev) {
        const RemovedEntityData = {
            id: ev.removedEntity.id,
            location: ev.removedEntity.location,
            dimension: ev.removedEntity.dimension.id
        };
        system.run(() => {
            if (this.config.Xp_Queue.has(RemovedEntityData.id)) {
                const xpData = this.config.Xp_Queue.get(RemovedEntityData.id);
                const xp_orb = world.getDimension(RemovedEntityData.dimension).getEntities({
                    location: RemovedEntityData.location,
                    type: "minecraft:xp_orb",
                    maxDistance: 1
                });
                for (let i = 0; i < xpData; i++) {
                    xp_orb.forEach((orb) => {
                        if (orb.isValid) {
                            const orbSpawn = world.getDimension(RemovedEntityData.dimension).spawnEntity("minecraft:xp_orb", orb.location);
                            // orbSpawn.teleport(orbSpawn.location);
                        }
                    });
                }
            }
        });
    }
    onEntityInteract(ev) {
        const amount = ev.target.getDynamicProperty("StackingAmount");
        if (amount && amount > 1) {
            const currAmount = amount || 1;
            system.run(() => {
                if (!ev.target.isValid)
                    return;
                const entityNew = spawnEntityClone(ev.target);
                entityNew.setDynamicProperty("StackingAmount", currAmount - 1);
                const displayText = this.config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";
                if (currAmount - 1 > 1) {
                    let text = displayText;
                    text = `§e ` + text;
                    text = text.replace(/%a/g, `${getMobColorCode(currAmount - 1)}x${currAmount - 1}§r`);
                    text = text.replace(/%n/g, EntityToName(entityNew));
                    text = text.replace(/%l/g, "\n");
                    entityNew.nameTag = text;
                }
                ev.target.setDynamicProperty("StackingAmount", 1);
                if (ev.target.nameTag.includes("")) {
                    ev.target.nameTag = "";
                    this.config.ResetEntities.add(ev.target);
                    system.runTimeout(() => {
                        this.config.ResetEntities.delete(ev.target);
                    }, 200);
                }
                else {
                    this.config.ResetEntities.add(ev.target);
                    system.runTimeout(() => {
                        this.config.ResetEntities.delete(ev.target);
                    }, 200);
                }
            });
        }
    }
    onEntityDie(ev) {
        if (!ev.deadEntity.isValid)
            return;
        if (ev.deadEntity.hasComponent(EntityProjectileComponent.componentId))
            return;
        if (ev.damageSource.cause == EntityDamageCause.none || ev.damageSource.cause == EntityDamageCause.selfDestruct)
            return;
        const currAmount = ev.deadEntity.getDynamicProperty("StackingAmount") || 1;
        if (currAmount <= 1)
            return;
        const MobDeathMode = this.config.MobStackConfig.get("MobDeathMode") || "All";
        if (MobDeathMode === "All") {
            const spawnClone = spawnEntityClone(ev.deadEntity);
            if (currAmount > 32) {
                for (let i = 0; i < 31; i++) {
                    const { x, y, z } = spawnClone.location;
                    const randomTag = Array.from({ length: Math.floor(Math.random() * 13) + 1 }, () => String.fromCharCode(Math.random() < 0.5
                        ? Math.floor(Math.random() * 26) + 65 // A-Z
                        : Math.floor(Math.random() * 26) + 97 // a-z
                    )).join('');
                    if (!ev.damageSource.damagingEntity || !ev.damageSource.damagingEntity.isValid) {
                        spawnClone.addTag(randomTag);
                        spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                    }
                    else {
                        const itemHeld = ev.damageSource.damagingEntity.hasComponent(EntityEquippableComponent.componentId) ? ev.damageSource.damagingEntity.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand) : null;
                        spawnClone.addTag(randomTag);
                        if (itemHeld && ev.damageSource.damagingEntity.typeId === "minecraft:player") {
                            ev.damageSource.damagingEntity.dimension.runCommand(`execute as ${ev.damageSource.damagingEntity.name} at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`);
                        }
                        else if (ev.damageSource.cause === EntityDamageCause.projectile && ["minecraft:skeleton", "minecraft:stray", "minecraft:bogged"].includes(ev.damageSource.damagingEntity.typeId)) {
                            ev.damageSource.damagingEntity.addTag(randomTag + "_projectile");
                            ev.damageSource.damagingEntity.runCommand(`execute as @e[tag=${randomTag}_projectile] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                        else if (ev.damageSource.damagingEntity) {
                            const damagingEntity = ev.damageSource.damagingEntity;
                            damagingEntity.addTag(randomTag + "_entity");
                            damagingEntity.dimension.runCommand(`execute as @e[tag=${randomTag}_entity] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                        else {
                            spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                    }
                }
                spawnClone.remove();
                const entityNew = spawnEntityClone(ev.deadEntity);
                entityNew.setDynamicProperty("StackingAmount", currAmount - 32);
                const displayText = this.config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";
                let text = displayText;
                text = `§e ` + text;
                text = text.replace(/%a/g, `${getMobColorCode(currAmount - 32)}x${currAmount - 32}§r`);
                text = text.replace(/%n/g, EntityToName(entityNew));
                text = text.replace(/%l/g, "\n");
                entityNew.nameTag = text;
                this.config.Xp_Queue.set(ev.deadEntity.id, 31);
            }
            else {
                for (let i = 0; i < currAmount - 1; i++) {
                    const { x, y, z } = spawnClone.location;
                    const randomTag = Array.from({ length: Math.floor(Math.random() * 13) + 1 }, () => String.fromCharCode(Math.random() < 0.5
                        ? Math.floor(Math.random() * 26) + 65 // A-Z
                        : Math.floor(Math.random() * 26) + 97 // a-z
                    )).join('');
                    if (!ev.damageSource.damagingEntity || !ev.damageSource.damagingEntity.isValid) {
                        spawnClone.addTag(randomTag);
                        spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                    }
                    else {
                        const itemHeld = ev.damageSource.damagingEntity.hasComponent(EntityEquippableComponent.componentId) ? ev.damageSource.damagingEntity.getComponent(EntityEquippableComponent.componentId).getEquipment(EquipmentSlot.Mainhand) : null;
                        spawnClone.addTag(randomTag);
                        if (itemHeld && ev.damageSource.damagingEntity.typeId === "minecraft:player") {
                            ev.damageSource.damagingEntity.dimension.runCommand(`execute as ${ev.damageSource.damagingEntity.name} at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}] mainhand`);
                        }
                        else if (ev.damageSource.cause === EntityDamageCause.projectile && ["minecraft:skeleton", "minecraft:stray", "minecraft:bogged"].includes(ev.damageSource.damagingEntity.typeId)) {
                            ev.damageSource.damagingEntity.addTag(randomTag + "_projectile");
                            ev.damageSource.damagingEntity.runCommand(`execute as @e[tag=${randomTag}_projectile] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                        else if (ev.damageSource.damagingEntity) {
                            const damagingEntity = ev.damageSource.damagingEntity;
                            damagingEntity.addTag(randomTag + "_entity");
                            damagingEntity.dimension.runCommand(`execute as @e[tag=${randomTag}_entity] at @s run loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                        else {
                            spawnClone.dimension.runCommand(`loot spawn ${x} ${y} ${z} kill @e[tag=${randomTag}]`);
                        }
                    }
                }
                spawnClone.remove();
                this.config.Xp_Queue.set(ev.deadEntity.id, currAmount - 1);
            }
        }
        else if (ev.deadEntity.getDynamicProperty("StackingAmount")) {
            if (currAmount - 1 <= 0) {
                return;
            }
            else {
                const entityNew = spawnEntityClone(ev.deadEntity);
                if (currAmount - 1 <= 1)
                    return;
                entityNew.setDynamicProperty("StackingAmount", currAmount - 1);
                const displayText = this.config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";
                let text = displayText;
                text = `§e ` + text;
                text = text.replace(/%a/g, `${getMobColorCode(currAmount - 1)}x${currAmount - 1}§r`);
                text = text.replace(/%n/g, EntityToName(entityNew));
                text = text.replace(/%l/g, "\n");
                entityNew.nameTag = text;
            }
        }
    }
    runJobs() {
        system.runJob(StackingMob(this.config));
    }
    addConfig(pl, page, showUI = true) {
        if (!showUI)
            return true;
        const configUI = new IActionForm(LanguageContext.getTranslation("allstacker.title.mobstacker", pl), LanguageContext.getTranslation("allstacker.body.mobstacker", pl));
        configUI.addDivider();
        configUI.addLabel(LanguageContext.getTranslation("allstacker.label.mobstacker.description", pl));
        configUI.addButton(LanguageContext.getTranslation("allstacker.button.mobstacker_settings", pl), "textures/blocks/build_allow", () => {
            const stackedUI = new IActionForm(LanguageContext.getTranslation("allstacker.title.mob_stacking_settings", pl), LanguageContext.getTranslation("allstacker.body.mob_stacking_settings", pl));
            stackedUI.addDivider();
            stackedUI.addLabel(LanguageContext.getTranslation("allstacker.label.mobstacker.advanced.description", pl));
            stackedUI.addButton(LanguageContext.getTranslation("allstacker.button.add_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
                //find near mob in radius 10 
                const addStackedUI = new IActionForm(LanguageContext.getTranslation("allstacker.title.add_stacked_mobs", pl), LanguageContext.getTranslation("allstacker.body.add_stacked_mobs", pl));
                addStackedUI.addDivider();
                const radius = 10;
                const nearEntities = pl.dimension.getEntities({
                    location: pl.location,
                    maxDistance: radius
                }).filter((en) => en.typeId !== "minecraft:player");
                const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
                nearEntities.forEach((en) => {
                    if (en.isValid && !mobStackList.includes(en.typeId)) {
                        addStackedUI.addButton(`${EntityToName(en)}`, "", () => {
                            mobStackList.push(en.typeId);
                            this.config.MobStackConfig.set("StackMob", mobStackList);
                            pl.sendMessage(LanguageContext.getTranslation("allstacker.message.mob.added", pl).replace("%name", EntityToName(en)));
                            page.showPage(pl, this.name + "_stacked");
                        });
                    }
                });
                if ((nearEntities.filter((en) => en.isValid && !mobStackList.includes(en.typeId))).length === 0) {
                    addStackedUI.addLabel(LanguageContext.getTranslation("allstacker.label.no_stackable_mobs", pl));
                }
                addStackedUI.addDivider();
                addStackedUI.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
                    page.showPage(pl, this.name + "_stacked");
                });
                page.addPage(this.name + "_add_stacked", addStackedUI);
                page.showPage(pl, this.name + "_add_stacked");
            });
            stackedUI.addButton(LanguageContext.getTranslation("allstacker.button.remove_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
                const removeStackedUI = new IActionForm(LanguageContext.getTranslation("allstacker.title.remove_stacked_mobs", pl), LanguageContext.getTranslation("allstacker.body.remove_stacked_mobs", pl));
                removeStackedUI.addDivider();
                const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
                if (mobStackList.length === 0) {
                    removeStackedUI.addLabel(LanguageContext.getTranslation("allstacker.label.no_stacked_mobs", pl));
                }
                else {
                    mobStackList.forEach((mob) => {
                        removeStackedUI.addButton(IdToName(mob), "", () => {
                            const index = mobStackList.indexOf(mob);
                            if (index > -1) {
                                mobStackList.splice(index, 1);
                                this.config.MobStackConfig.set("StackMob", mobStackList);
                                pl.sendMessage(LanguageContext.getTranslation("allstacker.message.mob.removed", pl).replace("%name", IdToName(mob)));
                                page.showPage(pl, this.name + "_stacked");
                            }
                        });
                    });
                }
                removeStackedUI.addDivider();
                removeStackedUI.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
                    page.showPage(pl, this.name + "_stacked");
                });
                page.addPage(this.name + "_remove_stacked", removeStackedUI);
                page.showPage(pl, this.name + "_remove_stacked");
            });
            stackedUI.addButton(LanguageContext.getTranslation("allstacker.button.view_stacked_mobs", pl), "textures/ui/icon_book_writable", () => {
                const mobStackList = this.config.MobStackConfig.get("StackMob") || [];
                const stackedMobsUI = new IActionForm(LanguageContext.getTranslation("allstacker.title.view_stacked_mobs", pl), LanguageContext.getTranslation("allstacker.body.view_stacked_mobs", pl));
                stackedMobsUI.addDivider();
                if (mobStackList.length === 0) {
                    stackedMobsUI.addLabel(LanguageContext.getTranslation("allstacker.label.no_stacked_mobs", pl));
                }
                else {
                    mobStackList.forEach((mob) => {
                        stackedMobsUI.addButton(IdToName(mob), "", () => {
                            page.showPage(pl, this.name + "_stacked");
                        });
                    });
                }
                stackedMobsUI.addDivider();
                stackedMobsUI.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
                    page.showPage(pl, this.name + "_stacked");
                });
                page.addPage(this.name + "_view_stacked", stackedMobsUI);
                page.showPage(pl, this.name + "_view_stacked");
            });
            stackedUI.addDivider();
            stackedUI.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
                page.showPage(pl, this.name);
            });
            page.addPage(this.name + "_stacked", stackedUI);
            page.showPage(pl, this.name + "_stacked");
        });
        configUI.addLabel(LanguageContext.getTranslation("allstacker.label.mobstacker.advanced.description", pl));
        configUI.addButton(LanguageContext.getTranslation("allstacker.button.advanced_settings", pl), "textures/ui/advanced_glyph_color", () => {
            var _a;
            const advancedSettingsUI = new IModalForm(LanguageContext.getTranslation("allstacker.title.mob_advanced_settings", pl), LanguageContext.getTranslation("allstacker.body.mob_advanced_settings", pl));
            advancedSettingsUI.addLabel(LanguageContext.getTranslation("allstacker.label.mob_advanced.description", pl));
            advancedSettingsUI.addDivider();
            advancedSettingsUI.addToggle(LanguageContext.getTranslation("allstacker.toggle.mobstacker", pl), ((_a = PluginLoader.find((pl) => pl.name === this.name)) === null || _a === void 0 ? void 0 : _a.setting.enabled) || false);
            advancedSettingsUI.addDropdown(LanguageContext.getTranslation("allstacker.dropdown.mob_death_mode", pl), ["All", "Only one"], this.config.MobStackConfig.get("MobDeathMode") === "All" ? 0 : 1);
            advancedSettingsUI.addSlider(LanguageContext.getTranslation("allstacker.slider.radius_stacking", pl), 1, 100, 1, this.config.MobStackConfig.get("RadiusStacking") || 10);
            advancedSettingsUI.addTextField(LanguageContext.getTranslation("allstacker.textfield.mob_display_text", pl), LanguageContext.getTranslation("allstacker.textfield.mob_display_text.placeholder", pl), `${this.config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r"}`);
            advancedSettingsUI.addCallback((formValues, canceled) => {
                var _a;
                if (canceled)
                    return;
                const radius = formValues[4];
                const displayText = formValues[5];
                const mobDeathMode = formValues[3] === 0 ? "All" : "Only one";
                const isEnabled = formValues[2];
                const oldRadius = this.config.MobStackConfig.get("RadiusStacking") || 10;
                const oldDisplayText = this.config.MobStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";
                const oldEnabled = ((_a = PluginLoader.find((pl) => pl.name === this.name)) === null || _a === void 0 ? void 0 : _a.setting.enabled) || false;
                const oldDeathMode = this.config.MobStackConfig.get("MobDeathMode") || "All";
                console.info(mobDeathMode, oldDeathMode);
                if (mobDeathMode !== oldDeathMode && mobDeathMode !== undefined) {
                    this.config.MobStackConfig.set("MobDeathMode", mobDeathMode);
                    pl.sendMessage(LanguageContext.getTranslation("allstacker.message.mob_death_mode.changed", pl).replace("%value", mobDeathMode));
                }
                if (radius !== oldRadius && radius !== undefined) {
                    this.config.MobStackConfig.set("RadiusStacking", radius);
                    pl.sendMessage(LanguageContext.getTranslation("allstacker.message.stacking_radius.changed", pl).replace("%value", radius.toString()));
                }
                if (displayText !== oldDisplayText && displayText !== undefined) {
                    this.config.MobStackConfig.set("DisplayText", displayText);
                    pl.sendMessage(LanguageContext.getTranslation("allstacker.message.mob_display_text.changed", pl).replace("%value", displayText));
                }
                if (isEnabled !== oldEnabled && isEnabled !== undefined) {
                    PluginLoader.find((pl) => pl.name === this.name).setting.enabled = isEnabled;
                    ConfigMenu.setEnabled(this.name, isEnabled);
                    const message = isEnabled ?
                        LanguageContext.getTranslation("allstacker.message.mobstacker.enabled", pl) :
                        LanguageContext.getTranslation("allstacker.message.mobstacker.disabled", pl);
                    pl.sendMessage(message);
                }
            });
            advancedSettingsUI.setSubmitButton(LanguageContext.getTranslation("allstacker.button.save_changes", pl));
            page.addPage(this.name + "_advanced_settings", advancedSettingsUI);
            page.showPage(pl, this.name + "_advanced_settings");
        });
        configUI.addDivider();
        configUI.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
            page.showPage(pl, "plugin-settings");
        });
        page.addPage(this.name, configUI);
        return true;
    }
    initializeConfig() {
        this.config = this.getConfig();
        this.config.MobStackConfig = new JsonDatabase("MobStackConfig", world);
        if (!this.config.MobStackConfig.has("StackMob")) {
            this.config.MobStackConfig.set("StackMob", [
                "minecraft:pig",
                "minecraft:cow",
                "minecraft:sheep",
                "minecraft:chicken"
            ]);
        }
        if (!this.config.MobStackConfig.has("DisplayText")) {
            this.config.MobStackConfig.set("DisplayText", "§7§c§l%a §r%n§r");
        }
        if (!this.config.MobStackConfig.has("RadiusStacking")) {
            this.config.MobStackConfig.set("RadiusStacking", 10);
        }
        if (!this.config.MobStackConfig.has("MobDeathMode")) {
            this.config.MobStackConfig.set("MobDeathMode", "All");
        }
    }
}
export default MobStacker;
//# sourceMappingURL=index.js.map