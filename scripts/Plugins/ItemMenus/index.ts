import { ItemStack, Player, system, world } from "@minecraft/server";
import Plugins from "../../Class/Plugins";
import CustomEvents from "../../Events/CustomEvent";
import { ActionFormData } from "@minecraft/server-ui";
import allPlugins from "../../Configs/PluginConfigs";
import { ListSetting } from "../../Configs/SettingList";

export default class ItemMenus extends Plugins {
  private name: string;
  constructor(name: string) {
    super(name);
    this.name = name;
  }

  public setup(): void {
  }

  public init(): void {
    new CustomEvents(this.name).ItemUse((ev) => {
      if (ev.itemStack.typeId == "kisu:ac_setting") {
        ListSystems(ev.source)
        ev.source.playSound("random.pop")
      }
    })
  }
}

export function ListSystems(pl: Player) {
  const listUi = new ActionFormData()
  listUi.title("การตั้งค่าระบบ");
  listUi.body(` \n §eสวัสดี§7, §f${pl.name}\n §7คุณสามารถ§cตั้งค่า§7ระบบต่างๆได้ผ่านเมนูนี้\n\n`);
  allPlugins().forEach((plg, i) => {
    if (!plg.setting.isLoader) {
      listUi.button(`${plg.name} [${plg.setting.enabled ? "§2กำลังเปิดใช้งาน§r" : "§cปิดใช้งานเเล้ว§r"}]`, (i % 2 == 0 ? `textures/ui/ImpulseSquare` : `textures/ui/ChainSquare`))
    }
  })
  listUi.button("§cปิด")
  listUi.show(pl).then((res) => {
    if (res.canceled) return;
    if (res.selection !== allPlugins().filter(x => x.setting.isLoader == false).length) {
      SettingSystems(pl, res.selection)
    }
  })
}

export function SettingSystems(pl: Player, selected: number) {
  const listUi = new ActionFormData()
  const data = Object.keys(ListSetting)[selected];
  listUi.title(`§8การตั้งค่าระบบ §f| §2${data}§r`);
  listUi.body(` \n §eสวัสดี§7, §f${pl.name}\n §7คุณสามารถ§cตั้งค่า§7ระบบต่างๆได้ผ่านเมนูนี้§r\n\n`);
  Object.keys(ListSetting[data as "Item Stackers"](data, pl)).forEach((key) => {
    if (ListSetting[data as "Item Stackers"](data, pl)[key]() == null) {
      listUi.button(key, "textures/ui/settings_glyph_color_2x")
    } else {
      listUi.button(ListSetting[data as "Item Stackers"](data, pl)[key]().split(":")[0], ListSetting[data as "Item Stackers"](data, pl)[key]().split(":")[1])
    }
  })
  listUi.button("§cกลับ")
  listUi.show(pl).then((res) => {
    if (res.canceled) return;
    if (res.selection == Object.keys(ListSetting[data as "Item Stackers"](data, pl)).length) {
      ListSystems(pl)
      return;
    } else {
      ListSetting[data as "Item Stackers"](data, pl)[Object.keys(ListSetting[data as "Item Stackers"](data, pl))[res.selection]](true);
      return;
    }
  })
}