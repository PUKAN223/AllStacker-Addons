import { world } from "@minecraft/server";
import LanguageContextClass from "../../core/class/LangguageContext";
import { KXEvents } from "../../core";
export let LanguageContext = new LanguageContextClass();
KXEvents.on(null, "after:worldLoad", (ev) => {
    /**
     * const list = [
        "§8Unstacked Items",
        "Manage the items that are not stacked.",
        "§aCan§7 add, remove, view §cunstacked items§r.",
        "Add Unstacked Item",
        "§8Select Item",
        "Select an item in your inventory to unstack.",
        `§aAdded§r %name to unstacked items.`,
        "Remove Unstacked Item",
        "§8Remove Unstacked Item",
        "Select an item to remove from unstacked items.",
        "§cRemoved§r ${itemName(itemId)} from unstacked items.",
        "View Unstacked Items",
        "§8Unstacked Items",
        "List of items that are not stacked.",
        "§cNo unstacked items found.",
        "§cBack",
      ]
      const optionsConfig = {
        "Stacking Settings": () => {
          const unStackPage = new IActionForm(LanguageContext.getTranslation("allstacker.title.unstacked", pl), LanguageContext.getTranslation("allstacker.body.unstacked", pl));
          unStackPage.addDivider();
          unStackPage.addLabel(LanguageContext.getTranslation("allstacker.label.unstacked", pl));
  
          unStackPage.addButton(LanguageContext.getTranslation("allstacker.button.add_unstacked", pl), "textures/ui/icon_book_writable", () => {
            const inventory = pl.getComponent("inventory").container;
            const itemList: Record<string, ItemStack> = {};
            for (let i = 0; i < inventory.size; i++) {
              const item = inventory.getItem(i);
              if (item) {
                itemList[itemName(item.typeId)] = item;
              }
            }
            const itemSelectForm = new IActionForm(LanguageContext.getTranslation("allstacker.title.select_item", pl), LanguageContext.getTranslation("allstacker.body.select_item", pl));
            itemSelectForm.addDivider();
            Object.entries(itemList).forEach(([name, item]) => {
              if (!item || !item.typeId) return;
              if (this.config.ItemStackConfig.get("UnStackItem")?.includes(item.typeId)) return;
              itemSelectForm.addButton(name, "", () => {
                const unStackItems = this.config.ItemStackConfig.get("UnStackItem") || [];
                this.config.ItemStackConfig.set("UnStackItem", [...unStackItems, item.typeId]);
                pl.sendMessage(LanguageContext.getTranslation("allstacker.message.unstacked.added", pl).replace("%name", name));
                page.showPage(pl, this.name + "_unstacked");
              });
            });
            itemSelectForm.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
              page.showPage(pl, this.name + "_unstacked");
            });
            page.addPage(this.name + "_unstacked_select", itemSelectForm);
            page.showPage(pl, this.name + "_unstacked_select");
          });
  
          unStackPage.addButton(LanguageContext.getTranslation("allstacker.button.remove_unstacked", pl), "textures/ui/icon_book_writable", () => {
            const unStackItems: string[] = this.config.ItemStackConfig.get("UnStackItem") || [];
            const removeItemForm = new IActionForm(LanguageContext.getTranslation("allstacker.title.remove_unstacked", pl), LanguageContext.getTranslation("allstacker.body.remove_unstacked", pl));
            removeItemForm.addDivider();
            unStackItems.forEach((itemId) => {
              removeItemForm.addButton(itemName(itemId), "", () => {
                this.config.ItemStackConfig.set("UnStackItem", unStackItems.filter(id => id !== itemId));
                pl.sendMessage(LanguageContext.getTranslation("allstacker.message.unstacked.removed", pl).replace("%name", itemName(itemId)));
                page.showPage(pl, this.name + "_unstacked");
              });
            });
            removeItemForm.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
              page.showPage(pl, this.name + "_unstacked");
            });
            page.addPage(this.name + "_unstacked_remove", removeItemForm);
            page.showPage(pl, this.name + "_unstacked_remove");
          });
  
          unStackPage.addButton(LanguageContext.getTranslation("allstacker.button.view_unstacked", pl), "textures/ui/icon_book_writable", () => {
            const unStackItems: string[] = this.config.ItemStackConfig.get("UnStackItem") || [];
            const viewItemsForm = new IActionForm(LanguageContext.getTranslation("allstacker.title.unstacked_items", pl), LanguageContext.getTranslation("allstacker.body.unstacked_items", pl));
            viewItemsForm.addDivider();
            if (unStackItems.length === 0) {
              viewItemsForm.addLabel(LanguageContext.getTranslation("allstacker.label.no_unstacked_items", pl));
            } else {
              unStackItems.forEach((itemId) => {
                viewItemsForm.addButton(itemName(itemId), "", () => {
                  page.showPage(pl, this.name + "_unstacked");
                });
              });
            }
            viewItemsForm.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
              page.showPage(pl, this.name + "_unstacked");
            });
            page.addPage(this.name + "_unstacked_view", viewItemsForm);
            page.showPage(pl, this.name + "_unstacked_view");
          });
          unStackPage.addDivider();
          unStackPage.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
            page.showPage(pl, this.name);
          });
  
          page.addPage(this.name + "_unstacked", unStackPage);
          page.showPage(pl, this.name + "_unstacked");
        },
     */
    LanguageContext.setLanguage("en", {
        "allstacker.title.configmenu": (pl) => "§8All Stackers Settings",
        "allstacker.body.configmenu": (pl) => `Hello, §e${pl.name}§r!\n\nThis is the configuration menu.\nYou can manage settings here.`,
        "allstacker.button.language": (pl) => "§3Language",
        "allstacker.title.language": (pl) => "§8Language Settings",
        "allstacker.body.language": (pl) => "Select your preferred language.",
        "allstacker.message.language.set.english": (pl) => `§7[All Stacker] §rLanguage set to §aEnglish§r.`,
        "allstacker.message.language.set.thai": (pl) => `§7[All Stacker] §rLanguage set to §aไทย§r.`,
        "allstacker.button.back": (pl) => `§cBack`,
        "allstacker.label.plugin.list": (pl) => `§7Plugins`,
        "allstacker.label.plugin.enabled": (pl) => `§2Enabled§r`,
        "allstacker.label.plugin.disabled": (pl) => `§cDisabled§r`,
        // ItemStacker Main Settings
        "allstacker.title.itemstacker": (pl) => "§8Item Stackers Settings",
        "allstacker.body.itemstacker": (pl) => "Adjust the settings for item stacking.",
        "allstacker.label.itemstacker.description": (pl) => "§aCan§7 add, remove, view §cunstacked items§r.",
        "allstacker.button.stacking_settings": (pl) => "Stacking Settings",
        "allstacker.button.advanced_settings": (pl) => "Advanced Settings",
        "allstacker.label.advanced.description": (pl) => "§aCan§7 §2on§7/§coff§r and adjust the radius for seeing items, display text, and more.",
        // Unstacked Items
        "allstacker.title.unstacked": (pl) => "§8Unstacked Items",
        "allstacker.body.unstacked": (pl) => "Manage the items that are not stacked.",
        "allstacker.label.unstacked": (pl) => "§aCan§7 add, remove, view §cunstacked items§r.",
        "allstacker.button.add_unstacked": (pl) => "Add Unstacked Item",
        "allstacker.button.remove_unstacked": (pl) => "Remove Unstacked Item",
        "allstacker.button.view_unstacked": (pl) => "View Unstacked Items",
        // Add Unstacked Item
        "allstacker.title.select_item": (pl) => "§8Select Item",
        "allstacker.body.select_item": (pl) => "Select an item in your inventory to unstack.",
        "allstacker.message.unstacked.added": (pl) => `§aAdded§r %name to unstacked items.`,
        // Remove Unstacked Item
        "allstacker.title.remove_unstacked": (pl) => "§8Remove Unstacked Item",
        "allstacker.body.remove_unstacked": (pl) => "Select an item to remove from unstacked items.",
        "allstacker.message.unstacked.removed": (pl) => `§cRemoved§r %name from unstacked items.`,
        // View Unstacked Items
        "allstacker.title.unstacked_items": (pl) => "§8Unstacked Items",
        "allstacker.body.unstacked_items": (pl) => "List of items that are not stacked.",
        "allstacker.label.no_unstacked_items": (pl) => "§cNo unstacked items found.",
        // Advanced Settings
        "allstacker.title.advanced_settings": (pl) => "§8Advanced Settings",
        "allstacker.body.advanced_settings": (pl) => "Save changes.",
        "allstacker.label.advanced.description_full": (pl) => "Manage advanced settings for item stacking.",
        "allstacker.toggle.itemstack": (pl) => "§cOFF§7/§aON §rItemStack§r",
        "allstacker.slider.radius_seeing": (pl) => "§7Radius to seeing items§r",
        "allstacker.slider.radius_combine": (pl) => "§7Radius to combine items§r",
        "allstacker.textfield.display_text": (pl) => "§7Display Text§r\n %%a§7 - show amount§r\n %%n §7- show name§r\n %%m §7- show minutes§r\n %%s §7- show seconds§r\n %%l §7- new line§r",
        "allstacker.textfield.display_text.placeholder": (pl) => "Customize the text displayed for stacked items.",
        // Messages
        "allstacker.message.display_text.changed": (pl) => "§aDisplay text changed to: %value",
        "allstacker.message.radius_seeing.changed": (pl) => "§aRadius to seeing items§r changed to: %value",
        "allstacker.message.radius_combine.changed": (pl) => "§aRadius to combine items§r changed to: %value",
        "allstacker.message.plugin.enabled": (pl) => "§aItemStacker plugin is now enabled!",
        "allstacker.message.plugin.disabled": (pl) => "§aItemStacker plugin is now disabled!",
        // MobStacker Main Settings
        "allstacker.title.mobstacker": (pl) => "§8Mob Stacker Settings",
        "allstacker.body.mobstacker": (pl) => "Configure the Mob Stacker plugin.",
        "allstacker.label.mobstacker.description": (pl) => "§aCan§7 add, remove, view §bstacked mobs§r.",
        "allstacker.button.mobstacker_settings": (pl) => "Stacking Settings",
        "allstacker.label.mobstacker.advanced.description": (pl) => "§aCan§7 §2on§7/§coff§r and adjust the radius of stacking, display text of stacked mobs, and more.",
        // MobStacker Stacking Settings
        "allstacker.title.mob_stacking_settings": (pl) => "§8Stacking Settings",
        "allstacker.body.mob_stacking_settings": (pl) => "Configure the stacking settings for mobs.",
        "allstacker.button.add_stacked_mobs": (pl) => "Add Stacked Mobs",
        "allstacker.button.remove_stacked_mobs": (pl) => "Remove Stacked Mobs",
        "allstacker.button.view_stacked_mobs": (pl) => "View Stacked Mobs",
        // Add Stacked Mobs
        "allstacker.title.add_stacked_mobs": (pl) => "§8Add Stacked Mobs",
        "allstacker.body.add_stacked_mobs": (pl) => "Select the mobs you want to stack within a radius of 10 blocks.",
        "allstacker.label.no_stackable_mobs": (pl) => "§cNo stackable mobs found in the radius.",
        "allstacker.message.mob.added": (pl) => "§aAdded %name to the stackable mobs.",
        // Remove Stacked Mobs
        "allstacker.title.remove_stacked_mobs": (pl) => "§8Remove Stacked Mobs",
        "allstacker.body.remove_stacked_mobs": (pl) => "Select the mobs you want to remove from stacking.",
        "allstacker.label.no_stacked_mobs": (pl) => "§cNo stackable mobs found.",
        "allstacker.message.mob.removed": (pl) => "§aRemoved %name from the stackable mobs.",
        // View Stacked Mobs
        "allstacker.title.view_stacked_mobs": (pl) => "§8View Stacked Mobs",
        "allstacker.body.view_stacked_mobs": (pl) => "List of currently stackable mobs.",
        // MobStacker Advanced Settings
        "allstacker.title.mob_advanced_settings": (pl) => "§8Advanced Settings",
        "allstacker.body.mob_advanced_settings": (pl) => "",
        "allstacker.label.mob_advanced.description": (pl) => "Configure advanced settings for the Mob Stacker plugin.",
        "allstacker.toggle.mobstacker": (pl) => "§cOFF§7/§aON§f MobStacker",
        "allstacker.dropdown.mob_death_mode": (pl) => "§7Mob Death Mode",
        "allstacker.slider.radius_stacking": (pl) => "§7Radius to stacking near mobs",
        "allstacker.textfield.mob_display_text": (pl) => "§7Display Text\n §r%%a §7- show amount\n§r %%n §7- show name\n §r%%l §7- new line",
        "allstacker.textfield.mob_display_text.placeholder": (pl) => "Enter the display text for stacked mobs",
        "allstacker.button.save_changes": (pl) => "§8Save Changes",
        // MobStacker Messages
        "allstacker.message.mob_death_mode.changed": (pl) => "§aUpdated mob death mode to %value.",
        "allstacker.message.stacking_radius.changed": (pl) => "§aUpdated stacking radius to %value blocks.",
        "allstacker.message.mob_display_text.changed": (pl) => "§aUpdated display text to: %value",
        "allstacker.message.mobstacker.enabled": (pl) => "§aMob Stacker plugin is now enabled.",
        "allstacker.message.mobstacker.disabled": (pl) => "§aMob Stacker plugin is now disabled."
    });
    LanguageContext.setLanguage("th", {
        "allstacker.title.configmenu": (pl) => "§8การตั้งค่าทั้งหมด",
        "allstacker.body.configmenu": (pl) => `สวัสดี, §e${pl.name}§r!\n\nนี่คือเมนูการตั้งค่า.\nคุณสามารถจัดการการตั้งค่าได้ที่นี่.`,
        "allstacker.button.language": (pl) => "§3ภาษา",
        "allstacker.title.language": (pl) => "§8การตั้งค่าภาษา",
        "allstacker.body.language": (pl) => "เลือกภาษาที่คุณต้องการ.",
        "allstacker.message.language.set.english": (pl) => `§7[All Stacker] §rเปลี่ยนภาษาเป็น §aEnglish§r.`,
        "allstacker.message.language.set.thai": (pl) => `§7[All Stacker] §rเปลี่ยนภาษาเป็น §aไทย§r.`,
        "allstacker.button.back": (pl) => `§cกลับ`,
        "allstacker.label.plugin.list": (pl) => `§7ปลั๊กอิน`,
        "allstacker.label.plugin.enabled": (pl) => `§2เปิดใช้งาน§r`,
        "allstacker.label.plugin.disabled": (pl) => `§cปิดใช้งาน§r`,
        // ItemStacker Main Settings
        "allstacker.title.itemstacker": (pl) => "§8การตั้งค่าการรวมไอเท็ม",
        "allstacker.body.itemstacker": (pl) => "ปรับการตั้งค่าสำหรับการรวมไอเท็ม.",
        "allstacker.label.itemstacker.description": (pl) => "§aสามารถ§7 เพิ่ม, ลบ, ดู §cไอเท็มที่ไม่รวม§r.",
        "allstacker.button.stacking_settings": (pl) => "การตั้งค่าการรวม",
        "allstacker.button.advanced_settings": (pl) => "การตั้งค่าขั้นสูง",
        "allstacker.label.advanced.description": (pl) => "§aสามารถ§7 §2เปิด§7/§cปิด§r และปรับระยะการมองเห็นไอเท็ม, ข้อความแสดงผล และอื่นๆ",
        // Unstacked Items
        "allstacker.title.unstacked": (pl) => "§8รายการที่ไม่ถูกจัดเรียง",
        "allstacker.body.unstacked": (pl) => "จัดการรายการที่ไม่ถูกจัดเรียง.",
        "allstacker.label.unstacked": (pl) => "§aสามารถ§7 เพิ่ม, ลบ, ดู §cรายการที่ไม่ถูกจัดเรียง§r.",
        "allstacker.button.add_unstacked": (pl) => "เพิ่มรายการที่ไม่ถูกจัดเรียง",
        "allstacker.button.remove_unstacked": (pl) => "ลบรายการที่ไม่ถูกจัดเรียง",
        "allstacker.button.view_unstacked": (pl) => "ดูรายการที่ไม่ถูกจัดเรียง",
        // Add Unstacked Item
        "allstacker.title.select_item": (pl) => "§8เลือกไอเท็ม",
        "allstacker.body.select_item": (pl) => "เลือกไอเท็มในช่องเก็บของของคุณเพื่อไม่ให้ถูกจัดเรียง.",
        "allstacker.message.unstacked.added": (pl) => `§aเพิ่ม§r %name ลงในรายการที่ไม่ถูกจัดเรียง.`,
        // Remove Unstacked Item
        "allstacker.title.remove_unstacked": (pl) => "§8ลบรายการที่ไม่ถูกจัดเรียง",
        "allstacker.body.remove_unstacked": (pl) => "เลือกไอเท็มที่จะลบออกจากรายการที่ไม่ถูกจัดเรียง.",
        "allstacker.message.unstacked.removed": (pl) => `§cลบ§r %name ออกจากรายการที่ไม่ถูกจัดเรียง.`,
        // View Unstacked Items
        "allstacker.title.unstacked_items": (pl) => "§8รายการที่ไม่ถูกจัดเรียง",
        "allstacker.body.unstacked_items": (pl) => "รายการของไอเท็มที่ไม่ถูกจัดเรียง.",
        "allstacker.label.no_unstacked_items": (pl) => "§cไม่พบรายการที่ไม่ถูกจัดเรียง.",
        // Advanced Settings
        "allstacker.title.advanced_settings": (pl) => "§8การตั้งค่าขั้นสูง",
        "allstacker.body.advanced_settings": (pl) => "บันทึกการเปลี่ยนแปลง.",
        "allstacker.label.advanced.description_full": (pl) => "จัดการการตั้งค่าขั้นสูงสำหรับการรวมไอเท็ม.",
        "allstacker.toggle.itemstack": (pl) => "§cปิด§7/§aเปิด §rการรวมไอเท็ม§r",
        "allstacker.slider.radius_seeing": (pl) => "§7ระยะการมองเห็นไอเท็ม§r",
        "allstacker.slider.radius_combine": (pl) => "§7ระยะการรวมไอเท็ม§r",
        "allstacker.textfield.display_text": (pl) => "§7ข้อความแสดงผล§r\n %%a§7 - แสดงจำนวน§r\n %%n §7- แสดงชื่อ§r\n %%m §7- แสดงนาที§r\n %%s §7- แสดงวินาที§r\n %%l §7- บรรทัดใหม่§r",
        "allstacker.textfield.display_text.placeholder": (pl) => "ปรับแต่งข้อความที่แสดงสำหรับไอเท็มที่รวมกัน.",
        // Messages
        "allstacker.message.display_text.changed": (pl) => "§aเปลี่ยนข้อความแสดงผลเป็น: %value",
        "allstacker.message.radius_seeing.changed": (pl) => "§aเปลี่ยนระยะการมองเห็นไอเท็ม§r เป็น: %value",
        "allstacker.message.radius_combine.changed": (pl) => "§aเปลี่ยนระยะการรวมไอเท็ม§r เป็น: %value",
        "allstacker.message.plugin.enabled": (pl) => "§aเปิดใช้งานปลั๊กอิน ItemStacker แล้ว!",
        "allstacker.message.plugin.disabled": (pl) => "§aปิดใช้งานปลั๊กอิน ItemStacker แล้ว!",
        // MobStacker Main Settings
        "allstacker.title.mobstacker": (pl) => "§8การตั้งค่าการรวมมอบ",
        "allstacker.body.mobstacker": (pl) => "กำหนดค่าปลั๊กอิน Mob Stacker.",
        "allstacker.label.mobstacker.description": (pl) => "§aสามารถ§7 เพิ่ม, ลบ, ดู §bมอบที่รวมกัน§r.",
        "allstacker.button.mobstacker_settings": (pl) => "การตั้งค่าการรวม",
        "allstacker.label.mobstacker.advanced.description": (pl) => "§aสามารถ§7 §2เปิด§7/§cปิด§r และปรับระยะการรวม, ข้อความแสดงผลของมอบที่รวมกัน และอื่นๆ",
        // MobStacker Stacking Settings
        "allstacker.title.mob_stacking_settings": (pl) => "§8การตั้งค่าการรวม",
        "allstacker.body.mob_stacking_settings": (pl) => "กำหนดค่าการตั้งค่าการรวมสำหรับมอบ.",
        "allstacker.button.add_stacked_mobs": (pl) => "เพิ่มมอบที่รวมได้",
        "allstacker.button.remove_stacked_mobs": (pl) => "ลบมอบที่รวมได้",
        "allstacker.button.view_stacked_mobs": (pl) => "ดูมอบที่รวมได้",
        // Add Stacked Mobs
        "allstacker.title.add_stacked_mobs": (pl) => "§8เพิ่มมอบที่รวมได้",
        "allstacker.body.add_stacked_mobs": (pl) => "เลือกมอบที่คุณต้องการให้รวมได้ในระยะ 10 บล็อก.",
        "allstacker.label.no_stackable_mobs": (pl) => "§cไม่พบมอบที่สามารถรวมได้ในระยะนี้.",
        "allstacker.message.mob.added": (pl) => "§aเพิ่ม %name ลงในรายการมอบที่รวมได้.",
        // Remove Stacked Mobs
        "allstacker.title.remove_stacked_mobs": (pl) => "§8ลบมอบที่รวมได้",
        "allstacker.body.remove_stacked_mobs": (pl) => "เลือกมอบที่คุณต้องการลบออกจากการรวม.",
        "allstacker.label.no_stacked_mobs": (pl) => "§cไม่พบมอบที่รวมได้.",
        "allstacker.message.mob.removed": (pl) => "§aลบ %name ออกจากรายการมอบที่รวมได้.",
        // View Stacked Mobs
        "allstacker.title.view_stacked_mobs": (pl) => "§8ดูมอบที่รวมได้",
        "allstacker.body.view_stacked_mobs": (pl) => "รายการมอบที่สามารถรวมได้ในปัจจุบัน.",
        // MobStacker Advanced Settings
        "allstacker.title.mob_advanced_settings": (pl) => "§8การตั้งค่าขั้นสูง",
        "allstacker.body.mob_advanced_settings": (pl) => "",
        "allstacker.label.mob_advanced.description": (pl) => "กำหนดค่าการตั้งค่าขั้นสูงสำหรับปลั๊กอิน Mob Stacker.",
        "allstacker.toggle.mobstacker": (pl) => "§cปิด§7/§aเปิด§f MobStacker",
        "allstacker.dropdown.mob_death_mode": (pl) => "§7โหมดการตายของมอบ",
        "allstacker.slider.radius_stacking": (pl) => "§7ระยะการรวมมอบใกล้เคียง",
        "allstacker.textfield.mob_display_text": (pl) => "§7ข้อความแสดงผล\n §r%%a §7- แสดงจำนวน\n§r %%n §7- แสดงชื่อ\n §r%%l §7- บรรทัดใหม่",
        "allstacker.textfield.mob_display_text.placeholder": (pl) => "ใส่ข้อความแสดงผลสำหรับมอบที่รวมกัน",
        "allstacker.button.save_changes": (pl) => "§8บันทึกการเปลี่ยนแปลง",
        // MobStacker Messages
        "allstacker.message.mob_death_mode.changed": (pl) => "§aอัปเดตโหมดการตายของมอบเป็น %value.",
        "allstacker.message.stacking_radius.changed": (pl) => "§aอัปเดตระยะการรวมเป็น %value บล็อก.",
        "allstacker.message.mob_display_text.changed": (pl) => "§aอัปเดตข้อความแสดงผลเป็น: %value",
        "allstacker.message.mobstacker.enabled": (pl) => "§aปลั๊กอิน Mob Stacker เปิดใช้งานแล้ว.",
        "allstacker.message.mobstacker.disabled": (pl) => "§aปลั๊กอิน Mob Stacker ปิดใช้งานแล้ว."
    });
    world.getPlayers().forEach((pl) => {
        if (!pl.getDynamicProperty("language")) {
            LanguageContext.setPlayerLanguage(pl, "en");
        }
    });
});
//# sourceMappingURL=Lang.js.map