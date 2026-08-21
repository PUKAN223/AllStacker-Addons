import { Player } from "@minecraft/server";
import { LanguageManager } from "@axeth/api";

export function initTranslations() {
  const lang = LanguageManager.getInstance();

  lang.setLanguage("en", {
    "allstacker.text.wantOP": "§7You must be an Operator (OP) to use settings",
    "allstacker.toggle.fast_mode_stacking":
      "§cOFF§7/§aON §rFast Mode Stacking§r",
    "allstacker.message.fast_mode_stacking.changed":
      "§aFast Mode Stacking§r changed to: %value",
    "allstacker.title.configmenu": "§8All Stackers Settings",
    "allstacker.body.configmenu": (pl: Player) =>
      `Hello, §e${pl.name}§r!\n\nThis is the configuration menu.\nYou can manage settings here.`,
    "allstacker.button.language": "§3Language",
    "allstacker.title.language": "§8Language Settings",
    "allstacker.body.language": "Select your preferred language.",
    "allstacker.message.language.set.english":
      `§7[All Stacker] §rLanguage set to §aEnglish§r.`,
    "allstacker.message.language.set.thai":
      `§7[All Stacker] §rLanguage set to §aไทย§r.`,
    "allstacker.button.back": `§cBack`,
    "allstacker.label.plugin.list": `§7Plugins`,
    "allstacker.label.plugin.enabled": `§2Enabled§r`,
    "allstacker.label.plugin.disabled": `§cDisabled§r`,

    // ItemStacker Main Settings
    "allstacker.title.itemstacker": "§8Item Stackers Settings",
    "allstacker.body.itemstacker": "Adjust the settings for item stacking.",
    "allstacker.label.itemstacker.description":
      "§aCan§7 add, remove, view §cunstacked items§r.",
    "allstacker.button.stacking_settings": "Stacking Settings",
    "allstacker.button.advanced_settings": "Advanced Settings",
    "allstacker.label.advanced.description":
      "§aCan§7 §2on§7/§coff§r and adjust the radius for seeing items, display text, and more.",

    // Unstacked Items
    "allstacker.title.unstacked": "§8Unstacked Items",
    "allstacker.body.unstacked": "Manage the items that are not stacked.",
    "allstacker.label.unstacked":
      "§aCan§7 add, remove, view §cunstacked items§r.",
    "allstacker.button.add_unstacked": "Add Unstacked Item",
    "allstacker.button.remove_unstacked": "Remove Unstacked Item",
    "allstacker.button.view_unstacked": "View Unstacked Items",

    // Advanced Settings
    "allstacker.title.advanced_settings": "§8Advanced Settings",
    "allstacker.body.advanced_settings": "Save changes.",
    "allstacker.label.advanced.description_full":
      "Manage advanced settings for item stacking.",
    "allstacker.toggle.itemstack": "§cOFF§7/§aON §rItemStack§r",
    "allstacker.slider.radius_seeing": "§7Radius to seeing items§r",
    "allstacker.slider.radius_combine": "§7Radius to combine items§r",
    "allstacker.textfield.display_text":
      "§7Display Text§r\n %%a§7 - show amount§r\n %%n §7- show name§r\n %%m §7- show minutes§r\n %%s §7- show seconds§r\n %%l §7- new line§r",
    "allstacker.textfield.display_text.placeholder":
      "Customize the text displayed for stacked items.",

    // Messages
    "allstacker.message.display_text.changed":
      "§aDisplay text changed to: %value",
    "allstacker.message.radius_seeing.changed":
      "§aRadius to seeing items§r changed to: %value",
    "allstacker.message.radius_combine.changed":
      "§aRadius to combine items§r changed to: %value",
    "allstacker.message.plugin.enabled": "§aItemStacker plugin is now enabled!",
    "allstacker.message.plugin.disabled":
      "§aItemStacker plugin is now disabled!",

    // MobStacker Main Settings
    "allstacker.title.mobstacker": "§8Mob Stacker Settings",
    "allstacker.body.mobstacker": "Configure the Mob Stacker plugin.",
    "allstacker.label.mobstacker.description":
      "§aCan§7 add, remove, view §bstacked mobs§r.",
    "allstacker.button.mobstacker_settings": "Stacking Settings",
    "allstacker.label.mobstacker.advanced.description":
      "§aCan§7 §2on§7/§coff§r and adjust the radius of stacking, display text of stacked mobs, and more.",

    // MobStacker Stacking Settings
    "allstacker.title.mob_stacking_settings": "§8Stacking Settings",
    "allstacker.body.mob_stacking_settings":
      "Configure the stacking settings for mobs.",
    "allstacker.button.add_stacked_mobs": "Add Stacked Mobs",
    "allstacker.button.remove_stacked_mobs": "Remove Stacked Mobs",
    "allstacker.button.view_stacked_mobs": "View Stacked Mobs",

    // MobStacker Advanced Settings
    "allstacker.title.mob_advanced_settings": "§8Advanced Settings",
    "allstacker.body.mob_advanced_settings": "",
    "allstacker.label.mob_advanced.description":
      "Configure advanced settings for the Mob Stacker plugin.",
    "allstacker.toggle.mobstacker": "§cOFF§7/§aON§f MobStacker",
    "allstacker.dropdown.mob_death_mode": "§7Mob Death Mode",
    "allstacker.slider.radius_stacking": "§7Radius to stacking near mobs",
    "allstacker.textfield.mob_display_text":
      "§7Display Text\n §r%%a §7- show amount\n§r %%n §7- show name\n §r%%l §7- new line",
    "allstacker.textfield.mob_display_text.placeholder":
      "Enter the display text for stacked mobs",
    "allstacker.button.save_changes": "§8Save Changes",

    // MobStacker Messages
    "allstacker.message.mob_death_mode.changed":
      "§aUpdated mob death mode to %value.",
    "allstacker.message.stacking_radius.changed":
      "§aUpdated stacking radius to %value blocks.",
    "allstacker.message.mob_display_text.changed":
      "§aUpdated display text to: %value",
    "allstacker.message.mobstacker.enabled":
      "§aMob Stacker plugin is now enabled.",
    "allstacker.message.mobstacker.disabled":
      "§aMob Stacker plugin is now disabled.",

    // ItemStacker Settings Keys
    "Enabled": "Plugin Enabled",
    "FastMode": "Fast Mode Stacking",
    "RadiusSeeing": "Visibility Radius",
    "RadiusCombine": "Merge Radius",
    "DisplayText": "Display Format",
    "UnStackList": "Unstackable Items",

    // ItemStacker Tooltips
    "Toggle ItemStacker on or off": "Toggle ItemStacker on or off",
    "Run stacking every tick instead of co-operative job":
      "Run stacking every tick instead of co-operative job",
    "Radius (blocks) where item name-tags are shown to players":
      "Radius (blocks) where item name-tags are shown to players",
    "Radius (blocks) within which identical items are merged":
      "Radius (blocks) within which identical items are merged",
    "Name-tag format. Tokens: %a=amount %n=name %m=min %s=sec":
      "Name-tag format. Tokens: %a=amount %n=name %m=min %s=sec",
    "Comma-separated item type-IDs to never stack (e.g. minecraft:bow)":
      "Comma-separated item type-IDs to never stack (e.g. minecraft:bow)",

    // MobStacker Settings Keys
    "RadiusStacking": "Stacking Radius",
    "MobDeathMode": "Mob Death Mode",
    "MobStackList": "Stackable Mobs",
    "StackMob": "Stackable Mobs",
    "MassBreeding": "Mass Breeding",

    // MobStacker Tooltips
    "Radius (blocks) where mobs are stacked":
      "Radius (blocks) where mobs are stacked",
    "Radius (blocks) where mobs are merged":
      "Radius (blocks) where mobs are merged",
    "Mode: KillAll (dies all at once) or OneByOne (dies one by one)":
      "Mode: KillAll (dies all at once) or OneByOne (dies one by one)",
    "All = drop loot for all stacked mobs, Only one = drop once":
      "All = drop loot for all stacked mobs, Only one = drop once",
    "Comma-separated entity type-IDs to stack (e.g. minecraft:zombie)":
      "Comma-separated entity type-IDs to stack (e.g. minecraft:zombie)",
    "Comma-separated mob type-IDs to stack (e.g. minecraft:pig,minecraft:cow)":
      "Comma-separated mob type-IDs to stack (e.g. minecraft:pig,minecraft:cow)",
    "Toggle MobStacker on or off": "Toggle MobStacker on or off",
    "Name-tag format. Tokens: %a=amount %n=name":
      "Name-tag format. Tokens: %a=amount %n=name",
    "Enable feeding stacked mobs to breed them all at once": "Enable feeding stacked mobs to breed them all at once",

    // UI Extras
    "allstacker.ui.save": "§8Save",
    "allstacker.ui.developer": "Developer",
    "allstacker.ui.debug_data": "§8Debug Data",

    // Missing Translations
    "allstacker.title.debug.itemstacker": "Item Stacker Debug",
    "allstacker.body.debug.data": "Current internal data",
    "allstacker.title.debug.mobstacker": "Mob Stacker Debug",
    "allstacker.title.debug.config": "Config Usage",
    "allstacker.body.debug.config": "Approximate entity tracking count",
    "allstacker.label.no_new_mobs":
      "§7No new mobs nearby. Walk closer to mobs to add them.",
    "allstacker.label.no_stacked_mobs": "§7No stacked mobs configured.",
    "allstacker.label.no_new_items":
      "§7No new items nearby. Drop items to add them.",
    "allstacker.button.settings": "Settings",
    "allstacker.body.choose_option": "Choose an option:",
    "allstacker.label.no_settings":
      "§cNo settings available for this plugin.§r",
    "allstacker.message.mobstacker.added":
      "§7[All Stacker] §aAdded §f%value§a to stacked mob list.",
    "allstacker.message.mobstacker.removed":
      "§7[All Stacker] §cRemoved §f%value§c from stacked mob list.",
    "allstacker.message.itemstacker.added":
      "§7[All Stacker] §aAdded §f%value§a to unstacked item list.",
    "allstacker.message.itemstacker.removed":
      "§7[All Stacker] §cRemoved §f%value§c from unstacked item list.",
    "allstacker.message.debug.itemstacker.cleared":
      "§7[All Stacker] §aItemStacker data cleared.",
    "allstacker.message.debug.itemstacker.reset":
      "§7[All Stacker] §aItemStacker config reset to defaults.",
    "allstacker.message.debug.mobstacker.cleared":
      "§7[All Stacker] §aMobStacker data cleared.",
    "allstacker.message.debug.mobstacker.reset":
      "§7[All Stacker] §aMobStacker config reset to defaults.",
    "allstacker.label.no_unstacked_items": "§7No unstacked items configured.",
  });

  lang.setLanguage("th", {
    "allstacker.toggle.fast_mode_stacking":
      "§cปิด§7/§aเปิด §rFast Mode Stacking§r",
    "allstacker.message.fast_mode_stacking.changed":
      "§aFast Mode Stacking§r เปลี่ยนเป็น: %value",
    "allstacker.title.configmenu": "§8การตั้งค่าทั้งหมด",
    "allstacker.body.configmenu": (pl: Player) =>
      `สวัสดี, §e${pl.name}§r!\n\nนี่คือเมนูการตั้งค่า.\nคุณสามารถจัดการการตั้งค่าได้ที่นี่.`,
    "allstacker.button.language": "§3ภาษา",
    "allstacker.title.language": "§8การตั้งค่าภาษา",
    "allstacker.body.language": "เลือกภาษาที่คุณต้องการ.",
    "allstacker.message.language.set.english":
      `§7[All Stacker] §rเปลี่ยนภาษาเป็น §aEnglish§r.`,
    "allstacker.message.language.set.thai":
      `§7[All Stacker] §rเปลี่ยนภาษาเป็น §aไทย§r.`,
    "allstacker.button.back": `§cกลับ`,
    "allstacker.label.plugin.list": `§7ปลั๊กอิน`,
    "allstacker.label.plugin.enabled": `§2เปิดใช้งาน§r`,
    "allstacker.label.plugin.disabled": `§cปิดใช้งาน§r`,

    "allstacker.title.itemstacker": "§8การตั้งค่าการรวมไอเท็ม",
    "allstacker.body.itemstacker": "ปรับการตั้งค่าสำหรับการรวมไอเท็ม.",
    "allstacker.title.mobstacker": "§8การตั้งค่าการรวมมอบ",
    "allstacker.body.mobstacker": "กำหนดค่าปลั๊กอิน Mob Stacker.",

    // ItemStacker Settings Keys
    "Enabled": "เปิดใช้งานปลั๊กอิน",
    "FastMode": "โหมดสแต็กแบบเร็ว",
    "RadiusSeeing": "ระยะการมองเห็น",
    "RadiusCombine": "ระยะการรวมไอเท็ม",
    "DisplayText": "รูปแบบข้อความ",
    "UnStackList": "ไอเท็มที่ไม่ต้องรวม",

    // ItemStacker Tooltips
    "Toggle ItemStacker on or off": "เปิดหรือปิดระบบ ItemStacker",
    "Run stacking every tick instead of co-operative job":
      "รันการทำงานทุก tick แทนการแชร์ประสิทธิภาพ (กินสเปคมากขึ้นแต่เร็ว)",
    "Radius (blocks) where item name-tags are shown to players":
      "ระยะ (บล็อก) ที่จะแสดงชื่อและจำนวนไอเท็มให้ผู้เล่นเห็น",
    "Radius (blocks) within which identical items are merged":
      "ระยะ (บล็อก) ที่ไอเท็มชนิดเดียวกันจะถูกดูดรวมกัน",
    "Name-tag format. Tokens: %a=amount %n=name %m=min %s=sec":
      "รูปแบบข้อความ ตัวแปร: %a=จำนวน %n=ชื่อ %m=นาที %s=วินาที",
    "Comma-separated item type-IDs to never stack (e.g. minecraft:bow)":
      "รายชื่อไอเท็มคั่นด้วยลูกน้ำที่จะไม่ถูกดูดรวมกัน (เช่น minecraft:bow)",

    // MobStacker Settings Keys
    "RadiusStacking": "ระยะการรวมมอบ",
    "MobDeathMode": "โหมดการตาย",
    "MobStackList": "ม็อบที่รวมได้",
    "StackMob": "ม็อบที่รวมได้",
    "MassBreeding": "ระบบผสมพันธุ์แบบกลุ่ม",

    // MobStacker Tooltips
    "Radius (blocks) where mobs are stacked":
      "ระยะ (บล็อก) ที่ม็อบชนิดเดียวกันจะถูกรวม",
    "Radius (blocks) where mobs are merged": "ระยะ (บล็อก) ที่ม็อบชนิดเดียวกันจะถูกรวม",
    "Mode: KillAll (dies all at once) or OneByOne (dies one by one)":
      "โหมด KillAll (ตายพร้อมกันหมด) หรือ OneByOne (ตายทีละตัว)",
    "All = drop loot for all stacked mobs, Only one = drop once":
      "All = ดรอปไอเท็มของทุกตัว, Only one = ดรอปแค่ครั้งเดียว",
    "Comma-separated entity type-IDs to stack (e.g. minecraft:zombie)":
      "รายชื่อม็อบคั่นด้วยลูกน้ำที่จะถูกรวม (เช่น minecraft:zombie)",
    "Comma-separated mob type-IDs to stack (e.g. minecraft:pig,minecraft:cow)":
      "รายชื่อม็อบคั่นด้วยลูกน้ำที่จะถูกรวม (เช่น minecraft:pig,minecraft:cow)",
    "Toggle MobStacker on or off": "เปิดหรือปิดระบบ MobStacker",
    "Name-tag format. Tokens: %a=amount %n=name":
      "รูปแบบข้อความ ตัวแปร: %a=จำนวน %n=ชื่อ",
    "Enable feeding stacked mobs to breed them all at once": "เปิด/ปิด การให้อาหารสัตว์ทั้งสแต็กเพื่อผสมพันธุ์ทั้งหมดในครั้งเดียว",

    "allstacker.button.stacking_settings": "การตั้งค่าสแต็ก",
    "allstacker.button.advanced_settings": "การตั้งค่าขั้นสูง",
    "allstacker.label.advanced.description":
      "§aสามารถ§7 §2เปิด§7/§cปิด§r และปรับรัศมีการมองเห็น รูปแบบข้อความ และอื่นๆ",
    "allstacker.title.unstacked": "§8ไอเท็มที่ไม่ต้องรวม",
    "allstacker.body.unstacked": "จัดการไอเท็มที่จะไม่ถูกรวม",
    "allstacker.label.unstacked": "§aสามารถ§7 เพิ่ม, ลบ, ดู §cไอเท็มที่ไม่ต้องรวม§r",
    "allstacker.button.add_unstacked": "เพิ่มไอเท็มที่ไม่ต้องรวม",
    "allstacker.button.remove_unstacked": "ลบไอเท็มที่ไม่ต้องรวม",
    "allstacker.button.view_unstacked": "ดูไอเท็มที่ไม่ต้องรวม",
    "allstacker.title.mob_stacking_settings": "§8การตั้งค่าการรวมมอบ",
    "allstacker.body.mob_stacking_settings": "กำหนดค่าการรวมมอบ",
    "allstacker.button.add_stacked_mobs": "เพิ่มม็อบที่รวมได้",
    "allstacker.button.remove_stacked_mobs": "ลบม็อบที่รวมได้",
    "allstacker.button.view_stacked_mobs": "ดูม็อบที่รวมได้",
    "allstacker.title.mob_advanced_settings": "§8การตั้งค่าขั้นสูง",
    "allstacker.label.itemstacker.description":
      "§aสามารถ§7 เพิ่ม, ลบ, ดู §cไอเท็มที่ไม่ต้องรวม§r",
    "allstacker.label.mobstacker.description":
      "§aสามารถ§7 เพิ่ม, ลบ, ดู §bม็อบที่ถูกรวม§r",
    "allstacker.label.mobstacker.advanced.description":
      "§aสามารถ§7 §2เปิด§7/§cปิด§r และปรับรัศมี รูปแบบข้อความ และอื่นๆ",

    // UI Extras
    "allstacker.ui.save": "§8บันทึก",
    "allstacker.ui.developer": "ผู้พัฒนา",
    "allstacker.ui.debug_data": "§8ข้อมูลดีบัก",

    // Missing Translations
    "allstacker.title.debug.itemstacker": "ข้อมูลดีบัก Item Stacker",
    "allstacker.body.debug.data": "ข้อมูลภายในปัจจุบัน",
    "allstacker.title.debug.mobstacker": "ข้อมูลดีบัก Mob Stacker",
    "allstacker.title.debug.config": "การใช้งาน Config",
    "allstacker.body.debug.config": "จำนวนเอนทิตีที่ถูกติดตามโดยประมาณ",
    "allstacker.label.no_new_mobs":
      "§7ไม่พบม็อบใหม่ในบริเวณใกล้เคียง ลองเดินเข้าไปใกล้ม็อบเพื่อเพิ่ม",
    "allstacker.label.no_stacked_mobs": "§7ไม่มีม็อบที่กำหนดค่าให้ถูกรวม",
    "allstacker.label.no_new_items":
      "§7ไม่พบไอเท็มใหม่ในบริเวณใกล้เคียง ลองโยนไอเท็มเพื่อเพิ่ม",
    "allstacker.button.settings": "การตั้งค่า",
    "allstacker.body.choose_option": "เลือกตัวเลือก:",
    "allstacker.label.no_settings": "§cไม่มีการตั้งค่าสำหรับปลั๊กอินนี้§r",
    "allstacker.message.mobstacker.added":
      "§7[All Stacker] §aเพิ่ม §f%value§a ลงในรายชื่อม็อบที่รวมแล้ว",
    "allstacker.message.mobstacker.removed":
      "§7[All Stacker] §cลบ §f%value§c ออกจากรายชื่อม็อบที่รวมแล้ว",
    "allstacker.message.itemstacker.added":
      "§7[All Stacker] §aเพิ่ม §f%value§a ลงในรายชื่อไอเท็มที่ไม่รวม",
    "allstacker.message.itemstacker.removed":
      "§7[All Stacker] §cลบ §f%value§c ออกจากรายชื่อไอเท็มที่ไม่รวม",
    "allstacker.message.debug.itemstacker.cleared":
      "§7[All Stacker] §aล้างข้อมูล ItemStacker สำเร็จ",
    "allstacker.message.debug.itemstacker.reset":
      "§7[All Stacker] §aรีเซ็ตค่า Config ของ ItemStacker เป็นค่าเริ่มต้นสำเร็จ",
    "allstacker.message.debug.mobstacker.cleared":
      "§7[All Stacker] §aล้างข้อมูล MobStacker สำเร็จ",
    "allstacker.message.debug.mobstacker.reset":
      "§7[All Stacker] §aรีเซ็ตค่า Config ของ MobStacker เป็นค่าเริ่มต้นสำเร็จ",
    "allstacker.label.no_unstacked_items": "§7ไม่มีไอเท็มที่กำหนดค่าไม่ให้ถูกรวม",
    "All": "ทั้งหมด (ดรอปของทุกตัว)",
    "Only one": "ทีละตัว (ดรอปของทีละตัว)",
  });
}
