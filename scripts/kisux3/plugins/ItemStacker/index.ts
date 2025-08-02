import { Entity, EntityRemoveBeforeEvent, EntitySpawnAfterEvent, ItemStack, Player, ShutdownEvent, StartupEvent, system, world, WorldLoadAfterEvent } from "@minecraft/server";
import { ItemConvert, ItemJson, JsonDatabase, KXEvents, PageBuilder, PluginBase } from "../../../core";
import { deStackItemStack, SeeingItem, StackingItem } from "./services/utils";
import IActionForm from "../../../core/class/forms/IActionForm";
import IModalForm from "../../../core/class/forms/IModalForm";
import { PluginLoader } from "../../configs/PluginLoader";
import ConfigMenu from "../ConfigMenu";
import { LanguageContext } from "../../configs/Lang";

export interface IConfigItemStacker {
  ItemStackConfig: JsonDatabase | null;
  ItemStackData: JsonDatabase | null;
  ItemListStack: Set<Entity>;
  SeeingItemStack: Set<Entity>;
  PluginIcon: string;
  isLoaded: boolean;
  DimensionDataBackUp: JsonDatabase | null;
}

const itemName = (item: string) => {
  return (item.split(":")[1] ? item.split(":")[1] : item)
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

class ItemStacker extends PluginBase {
  private config: IConfigItemStacker = {} as IConfigItemStacker;

  public addConfig(pl: Player, page: PageBuilder, showUI: boolean = true): boolean {
    if (!showUI) return true;

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
          itemSelectForm.addDivider();
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
      "Advanced Settings": () => {
        const advandSetting = new IModalForm(LanguageContext.getTranslation("allstacker.title.advanced_settings", pl), LanguageContext.getTranslation("allstacker.body.advanced_settings", pl));
        const isEnable = PluginLoader.find(plugin => plugin.name === this.name)?.setting.enabled || false;
        const RadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
        const RadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;
        const DisplayText = this.config.ItemStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";

        advandSetting.addLabel(LanguageContext.getTranslation("allstacker.label.advanced.description_full", pl));
        advandSetting.addDivider();
        advandSetting.addToggle(LanguageContext.getTranslation("allstacker.toggle.itemstack", pl), isEnable)
        advandSetting.addSlider(LanguageContext.getTranslation("allstacker.slider.radius_seeing", pl), 1, 50, 1, RadiusSeeing);
        advandSetting.addSlider(LanguageContext.getTranslation("allstacker.slider.radius_combine", pl), 1, 50, 1, RadiusCombine);
        advandSetting.addTextField(LanguageContext.getTranslation("allstacker.textfield.display_text", pl), LanguageContext.getTranslation("allstacker.textfield.display_text.placeholder", pl), DisplayText);

        advandSetting.addCallback((values, canceled) => {
          if (canceled) return;
          const isEnable = values[2];
          const radiusSeeing = values[3];
          const radiusCombine = values[4];
          const displayText = values[5];

          const oldEnable = PluginLoader.find(plugin => plugin.name === this.name)?.setting.enabled || false;
          const oldRadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
          const oldDisplayText = this.config.ItemStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r";
          const oldRadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;

          this.config.ItemStackConfig.set("RadiusSeeing", radiusSeeing);
          this.config.ItemStackConfig.set("DisplayText", displayText);
          this.config.ItemStackConfig.set("RadiusCombine", radiusCombine);

          if (oldDisplayText !== displayText && displayText !== undefined) {
            pl.sendMessage(LanguageContext.getTranslation("allstacker.message.display_text.changed", pl).replace("%value", displayText));
          }
          if (oldRadiusSeeing !== radiusSeeing && radiusSeeing !== undefined) {
            pl.sendMessage(LanguageContext.getTranslation("allstacker.message.radius_seeing.changed", pl).replace("%value", radiusSeeing.toString()));
          }
          if (oldRadiusCombine !== radiusCombine && radiusCombine !== undefined) {
            pl.sendMessage(LanguageContext.getTranslation("allstacker.message.radius_combine.changed", pl).replace("%value", radiusCombine.toString()));
          }

          if (oldEnable !== isEnable && isEnable !== undefined) {
            PluginLoader.find(plugin => plugin.name === this.name).setting.enabled = isEnable;
            ConfigMenu.setEnabled(this.name, isEnable);
            const message = isEnable ?
              LanguageContext.getTranslation("allstacker.message.plugin.enabled", pl) :
              LanguageContext.getTranslation("allstacker.message.plugin.disabled", pl);
            pl.sendMessage(message);
          }

        })
        page.addPage(this.name + "_advanced_settings", advandSetting);
        page.showPage(pl, this.name + "_advanced_settings");
      }
    }

    const configUi = new IActionForm(LanguageContext.getTranslation("allstacker.title.itemstacker", pl), LanguageContext.getTranslation("allstacker.body.itemstacker", pl));
    configUi.addDivider();
    configUi.addLabel(LanguageContext.getTranslation("allstacker.label.itemstacker.description", pl));

    configUi.addButton(LanguageContext.getTranslation("allstacker.button.stacking_settings", pl), "textures/blocks/barrier", () => {
      optionsConfig["Stacking Settings"]();
    });

    configUi.addLabel(LanguageContext.getTranslation("allstacker.label.advanced.description", pl));
    configUi.addButton(LanguageContext.getTranslation("allstacker.button.advanced_settings", pl), "textures/ui/settings_glyph_color_2x", () => {
      optionsConfig["Advanced Settings"]();
    });
    configUi.addDivider();
    configUi.addButton(LanguageContext.getTranslation("allstacker.button.back", pl), "", () => {
      page.showPage(pl, "plugin-settings");
    });

    page.addPage(this.name, configUi);
    return true;
  }
  public onItemSpawned(ev: EntitySpawnAfterEvent) {
    const isNewItems = (item: Entity) => {
      return (
        ev.entity.isValid &&
        item.typeId === "minecraft:item" &&
        !this.config.ItemStackData.has(ev.entity.id) &&
        !ev.entity.hasTag("fakeItem")
      )
    }

    if (isNewItems(ev.entity)) {
      this.config.ItemListStack.add(ev.entity);
    }
  }

  public onItemRemoved(ev: EntityRemoveBeforeEvent) {
    if (
      ev.removedEntity.typeId !== "minecraft:item" ||
      ev.removedEntity.hasTag("fakeItem") ||
      this.config.ItemListStack.has(ev.removedEntity)
    ) return;

    const itemRemovedData = {
      location: ev.removedEntity.location,
      id: ev.removedEntity.id,
      dim: ev.removedEntity.dimension.id,
    }

    system.run(() => deStackItemStack(this.config, itemRemovedData));
  }

  public runJobs(): void {
    system.runJob(StackingItem(this.config));
    system.runJob(SeeingItem(this.config));
  }

  public onLoad(ev: WorldLoadAfterEvent): void {
    this.initializeConfig();
    this.runJobs();

    KXEvents.on(this, "after:entitySpawn", (ev) => {
      this.onItemSpawned(ev);
    });
    KXEvents.on(this, "before:entityRemove", (ev) => {
      this.onItemRemoved(ev);
    });
    this.config.isLoaded = true;
  }

  public onStartup(ev: StartupEvent): void { };
  public onShutdown(ev: ShutdownEvent): void { };

  private initializeConfig(): void {
    this.config = this.getConfig() as IConfigItemStacker;
    this.config.ItemStackConfig = new JsonDatabase("ItemStackConfig", world);
    this.config.ItemStackData = new JsonDatabase("ItemStackData", world);
    this.config.DimensionDataBackUp = new JsonDatabase("DimensionDataBackUp", world);

    const UnStackItem = this.config.ItemStackConfig.get("UnStackItem") as string[] || [];
    const DisplayText = this.config.ItemStackConfig.get("DisplayText") || "§7§c§l%a §r%n§r"
    const RadiusSeeing = this.config.ItemStackConfig.get("RadiusSeeing") || 10;
    const RadiusCombine = this.config.ItemStackConfig.get("RadiusCombine") || 15;
    this.config.ItemStackConfig.set("UnStackItem", UnStackItem);
    this.config.ItemStackConfig.set("DisplayText", DisplayText);
    this.config.ItemStackConfig.set("RadiusSeeing", RadiusSeeing);
    this.config.ItemStackConfig.set("RadiusCombine", RadiusCombine);
  }
}

export default ItemStacker;