import { ActionFormData, MessageFormData, ModalFormData } from "@minecraft/server-ui";
import { system } from "@minecraft/server";
import setConfig from "../Plugins/PluginManagers/Functions/SetConfig";
import allPlugins from "./PluginConfigs";
import { SettingSystems } from "../Plugins/ItemMenus";
import { DisplayText, UnStackItem, UnStackMob } from "../Plugins/ItemStacker/Configs/Database";
import CustomEvents from "../Events/CustomEvent";
const MobAdd = new Map();
new CustomEvents("Plugin Managers").EntityInteract((ev) => {
    if (ev.player.hasTag("mobAdders")) {
        MobAdd.set(ev.player, ev.target.typeId);
    }
});
const formatName = (id) => id.split(":")[1]
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
const togglePlugin = (name, pl, enabled, callback) => {
    if (!enabled) {
        const state = !enabled;
        setConfig(name, state);
        pl.sendMessage(`§7[§f${name}§7]§r§f:§r ${state ? "§aเปิดใช้งาน" : "§cปิดใช้งาน"}§7สำเร็จ หากไม่ทำงานให้§cออกเกมเข้าใหม่อีกรอบ§r`);
        allPlugins();
        callback();
        return;
    }
    const ui = new MessageFormData()
        .title("§8ปิดระบบ")
        .body(`\n§7คุณแน่ใจหรือไม่ว่าต้องการ§cปิด§7การใช้งานการรวม${name.includes("Item") ? "ไอเท็ม" : "ม็อบ"}\nหาก§cปิด§7ใช้งาน ${name.includes("Item") ? "ไอเท็ม" : "ม็อบ"}ที่รวมกันอยู่จะไม่ทำงาน`)
        .button1("§2ยืนยัน")
        .button2("§cย้อนกลับ");
    ui.show(pl).then(res => {
        if (res.canceled)
            return;
        if (res.selection === 1) {
            SettingSystems(pl, 0);
        }
        else {
            const state = !enabled;
            setConfig(name, state);
            pl.sendMessage(`§7[§f${name}§7]§r§f:§r ${state ? "§aเปิดใช้งาน" : "§cปิดใช้งาน"}§7สำเร็จ หากไม่ทำงานให้§cออกเกมเข้าใหม่อีกรอบ§r`);
            allPlugins();
        }
    });
};
export const ListSetting = {
    "Item Stackers": (name, pl) => ({
        [`§cปิดการใช้งาน ${name}`]: (bool = false) => {
            if (bool)
                togglePlugin(name, pl, allPlugins().find(x => x.name === name).setting.enabled, () => { });
            return allPlugins().find(x => x.name === name).setting.enabled
                ? `§cปิด§8การใช้งาน ${name}`
                : `§2เปิด§8การใช้งาน ${name}`;
        },
        "รายชื่อไอเท็มที่ไม่รวมกัน": (bool = false) => {
            if (bool) {
                const items = [...UnStackItem.keys()];
                pl.sendMessage(items.length === 0
                    ? "§cไม่มีรายชื่อไอเท็ม"
                    : `§7รายชื่อไอเท็ม§f:\n§f  -§e${items.map(formatName).join("§r\n  §f-§e")}`);
            }
            return null;
        },
        "เพิ่มรายชื่อไอเท็มที่ไม่รวมกัน": (bool = false) => {
            if (bool) {
                const selectItem = () => {
                    pl.onScreenDisplay.setActionBar("§7กรุณานำไอเท็มที่จะเพิ่มไว้ในช่อง§cสล็อตแรก§7แล้ว§cกดย่อ§7");
                    if (pl.isSneaking) {
                        const item = pl.getComponent("inventory").container.getItem(0);
                        if (item) {
                            pl.playSound("random.pop");
                            UnStackItem.set(item.typeId, true);
                            pl.sendMessage(`§7[§f${name}§7]§r§f:§r §aเพิ่ม§7ไอเท็ม §e${formatName(item.typeId)} §7สำเร็จ§r`);
                        }
                    }
                    else {
                        system.run(selectItem);
                    }
                };
                system.run(selectItem);
            }
            return null;
        },
        "ลบรายชื่อไอเท็มที่ไม่รวมกัน": (bool = false) => {
            if (bool) {
                const items = [...UnStackItem.keys()];
                const ui = new ActionFormData()
                    .title("ลบรายชื่อไอเท็ม")
                    .body("\n กรุณาเลือกไอเท็มที่จะลบ\n ");
                items.map(formatName).forEach(btn => ui.button(btn));
                ui.button("กลับ");
                ui.show(pl).then(res => {
                    if (res.canceled || res.selection === items.length)
                        return SettingSystems(pl, 0);
                    const selectedItem = items[res.selection];
                    const confirm = new MessageFormData()
                        .title("ลบรายชื่อไอเท็ม")
                        .body(`คุณยืนยันที่จะลบไอเท็มนี้ ${formatName(selectedItem)}\nเพื่อให้กลับมาสามารถรวมกันได้ใช่หรือไม่`)
                        .button1("§2ยืนยัน")
                        .button2("§cย้อนกลับ");
                    confirm.show(pl).then(res => {
                        if (res.canceled)
                            return;
                        if (res.selection === 0) {
                            UnStackItem.delete(selectedItem);
                            pl.sendMessage(`§7[§f${name}§7]§r§f:§r §aลบ§7ไอเท็ม §e${formatName(selectedItem)} §7สำเร็จ§r`);
                        }
                    });
                });
            }
            return null;
        },
        "ตั้งค่าการเเสดงผลจำนวนไอเท็ม": (bool = false) => {
            var _a;
            if (bool) {
                const ui = new ModalFormData()
                    .title("ตั้งค่าการเเสดงผล")
                    .textField("\n ใช้ %%a เพื่อเเสดงจำนวน\n ใช้ %%n เพื่อเเสดงชื่อไอเท็ม\n ใช้ %%m เพื่อเเสดงนาทีที่ไอเท็มจะถูกลบ\n ใช้ %%s เพื่อเเสดงวินาทีที่ไอเท็มจะถูกลบ\n ใช้ \\n เพื่อเว้นบรรทัด\nรูปเเบบการเเสดง", "", (_a = DisplayText.get("itemStack")) !== null && _a !== void 0 ? _a : "§7x§c%a §e%n§r\\n§7Despawn in %m§am §7%s§as§r")
                    .toggle("รีเซ็ตการตั้งค่า", false);
                ui.show(pl).then(res => {
                    if (res.canceled)
                        return;
                    const [displayFormat, reset] = res.formValues;
                    if (reset) {
                        DisplayText.set("itemStack", "§7x§c%a §e%n§r\n§7Despawn in %m§am §7%s§as§r");
                        pl.sendMessage("§aรีเซ็ทตั้งค่าสำเร็จ§r");
                    }
                    else {
                        DisplayText.set("itemStack", displayFormat.toString().replace("\\n", "\n"));
                        pl.sendMessage("§aตั้งค่าสำเร็จ§r");
                    }
                });
            }
            return null;
        }
    }),
    "Mob Stackers": (name, pl) => {
        return {
            [`§cปิดการใช้งาน ${name}`]: (bool = false) => {
                if (bool)
                    togglePlugin(name, pl, allPlugins().find(x => x.name === name).setting.enabled, () => { });
                return allPlugins().find(x => x.name === name).setting.enabled
                    ? `§cปิด§8การใช้งาน ${name}`
                    : `§2เปิด§8การใช้งาน ${name}`;
            },
            "รายชื่อม็อบที่รวมกัน": (bool = false) => {
                if (bool) {
                    const mobs = [...UnStackMob.keys()];
                    pl.sendMessage(mobs.length === 0
                        ? "§cไม่มีรายชื่อม็อบ"
                        : `§7รายชื่อม็อบ§f:\n§f  -§e${mobs.map(formatName).join("§r\n  §f-§e")}`);
                }
                return null;
            },
            "เพิ่มรายชื่อม็อบที่รวมกัน": (bool = false) => {
                if (bool) {
                    pl.addTag("mobAdders");
                    function mobAdder() {
                        pl.onScreenDisplay.setActionBar("§cคลิกค้างที่ม็อบ§7เพื่อเพิ่มหรือ§cกดย่อ§7เพิ่มยกเลิก");
                        if (pl.isSneaking)
                            return;
                        if (MobAdd.has(pl)) {
                            UnStackMob.set(MobAdd.get(pl), true);
                            pl.sendMessage(`§7[§f${name}§7]§r§f:§r §aเพิ่ม§7ม็อบ §e${formatName(MobAdd.get(pl))} §7สำเร็จ§r`);
                            MobAdd.delete(pl);
                            pl.removeTag("mobAdders");
                        }
                        else {
                            system.run(mobAdder);
                        }
                    }
                    system.run(mobAdder);
                }
                return null;
            },
            "ลบรายชื่อม็อบที่รวมกัน": (bool = false) => {
                if (bool) {
                    const mobs = [...UnStackMob.keys()];
                    const ui = new ActionFormData()
                        .title("ลบรายชื่อม็อบ")
                        .body("\n กรุณาเลือกม็อบที่จะลบ\n ");
                    mobs.map(formatName).forEach(btn => ui.button(btn));
                    ui.button("กลับ");
                    ui.show(pl).then(res => {
                        if (res.canceled || res.selection === mobs.length)
                            return SettingSystems(pl, 0);
                        const selectedMob = mobs[res.selection];
                        const confirm = new MessageFormData()
                            .title("ลบรายชื่อม็อบ")
                            .body(`คุณยืนยันที่จะลบม็อบนี้ ${formatName(selectedMob)}\nเพื่อให้กลับมาสามารถรวมกันได้ใช่หรือไม่`)
                            .button1("§2ยืนยัน")
                            .button2("§cย้อนกลับ");
                        confirm.show(pl).then(res => {
                            if (res.canceled)
                                return;
                            if (res.selection === 0) {
                                UnStackMob.delete(selectedMob);
                                pl.sendMessage(`§7[§f${name}§7]§r§f:§r §aลบ§7ม็อบ §e${formatName(selectedMob)} §7สำเร็จ§r`);
                            }
                        });
                    });
                }
                return null;
            }
        };
    }
};
//# sourceMappingURL=SettingList.js.map