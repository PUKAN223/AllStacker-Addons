import { IActionForm, IModalForm, PlayerUtils, PluginBase } from "@axeth/api";
import {
  Entity,
  EntityEquippableComponent,
  EquipmentSlot,
  ItemStack,
  Player,
  PlayerInteractWithEntityBeforeEvent,
  system,
} from "@minecraft/server";
import { CookingData, CookingRecipesData } from "../types/CookingData.ts";
import { CookingDataManager } from "./CookingDataManager.ts";
import { CookingRecipesDataManager } from "./CookingRecipesDataManager.ts";

class CookingManager {
  private plugin: PluginBase;

  private cookingDataManager: CookingDataManager;
  private cookingRecipesDataManager: CookingRecipesDataManager;

  private constructor(plugin: PluginBase) {
    this.plugin = plugin;

    this.cookingDataManager = new CookingDataManager(plugin);
    this.cookingRecipesDataManager = new CookingRecipesDataManager(plugin);

    this.plugin.events.on(
      "BeforePlayerInteractWithEntity",
      (ev) => this.handleCookingInteraction(ev),
    );

    this.plugin.events.on("AfterTick", ({ currentTick }) => {
      if (currentTick % 20 !== 0) return;
      this.handleTick(currentTick);
    });

    this.plugin.events.on("AfterEntityHitEntity", (ev) => {
      const pl = ev.damagingEntity;

      if (!(pl instanceof Player)) return;

      if (this.isCookingPot(ev.hitEntity)) {
        this.handleSpoon(ev.hitEntity, pl);
      }
    }); //

    this.plugin.events.on("AfterEntitySpawn", (ev) => {
      if (this.isCookingPot(ev.entity)) {
        const block = ev.entity.dimension.getBlock(ev.entity.location);
        // i want only 0 90 180 270 degree rotation, so i use floor and mod
        //if current rotation near use this
        const currentRotation = ev.entity.getRotation().y;
        const rotationY = (Math.floor((currentRotation + 45) / 90) * 90) % 360;
        ev.entity.teleport(block?.center() ?? ev.entity.location, {
          rotation: {
            x: 0,
            y: rotationY,
          },
        });
      }
    });
  }

  static initialize(plugin: PluginBase) {
    return new CookingManager(plugin);
  }

  private isCookingPot(en: Entity) {
    return en.typeId === "kisu:pot";
  }

  private handleTick(_currentTick: number) {
    const players = this.plugin.world.getAllPlayers();
    const pots = new Set<Entity>();
    //get pot near player 10 block;
    for (const player of players) {
      const potEntities = player.dimension.getEntities({
        type: "kisu:pot",
        location: player.location,
        maxDistance: 10,
      });
      for (const pot of potEntities) {
        pots.add(pot);
      }
    }

    for (const pot of pots) {
      const cookingData = this.cookingDataManager.getCookingData(pot.id);
      if (!cookingData) continue;

      if (Math.random() > 0.5) {
        pot.dimension.playSound("bubble.pop", pot.location);
      }

      const isTimeout = this.handleTimeOut(pot, cookingData);
      if (!isTimeout) {
        const isInMinigame = this.handleIsMinigame(pot, cookingData);
        !isInMinigame && this.updatePotNameTag(pot, cookingData);
      }
    }
  }

  private handleSpoon(pot: Entity, pl: Player) {
    const cookingData = this.cookingDataManager.getCookingData(pot.id);
    if (!cookingData) return;

    const heldItem = pl.getComponent(EntityEquippableComponent.componentId)
      ?.getEquipment(EquipmentSlot.Mainhand);

    if (!heldItem || heldItem.typeId !== "kisu:spoon") {
      PlayerUtils.sendToast(
        pl,
        ``,
        `กรุณาใช้ช้อนเพื่อคน`,
        "textures/items/tools/spoon",
      );
      return;
    }

    if (cookingData.minigame) {
      this.cookingDataManager.editCookingData(pot.id, {
        minigame: null,
      });
      this.updatePotNameTag(pot, cookingData);
      this.showEffect(pot);
      pl.playSound("random.pop");
      return true;
    }
  }

  private handleIsMinigame(
    pot: Entity,
    cookingData: CookingData[number],
  ): boolean {
    if (cookingData.minigame) {
      //check minigame timeout
      if (this.plugin.system.currentTick - cookingData.minigame > 60) {
        this.cookingDataManager.removeCookingData(pot.id);
        pot.dimension.playSound("note.bit", pot.location, {
          volume: 2,
          pitch: 1,
        });
        const coal = new ItemStack("minecraft:charcoal", 1);
        const itemSpawn = pot.dimension.spawnItem(coal, pot.location);
        itemSpawn.applyImpulse({
          x: Math.random() * 0.2 - 0.1,
          y: 0.1,
          z: Math.random() * 0.2 - 0.1,
        });
        pot.nameTag = "";
        return true;
      }

      this.cookingDataManager.editCookingData(pot.id, {
        timeEndCooking: cookingData.timeEndCooking + 20,
      });
      this.updatePotNameTag(pot, cookingData);
      this.showEffect(pot);
      return true;
    }

    //random 0.7 to evnets minigame
    if (Math.random() > 0.7) {
      this.cookingDataManager.editCookingData(pot.id, {
        minigame: this.plugin.system.currentTick,
      });
      pot.dimension.playSound("mnp_ci.reel_complete", pot.location, {
        volume: 1,
      });
      this.updatePotNameTag(pot, {
        ...cookingData,
        minigame: this.plugin.system.currentTick,
      });
      this.showEffect(pot);
    }
    return false;
  }

  private showEffect(pot: Entity) {
    if (Math.random() > 0.3) {
      pot.dimension.playSound("random.fizz", pot.location);
      pot.dimension.spawnParticle(
        "minecraft:campfire_smoke_particle",
        pot.location,
      );
    }
  }

  private handleTimeOut(pot: Entity, cookingData: CookingData[number]) {
    if (cookingData.timeEndCooking <= this.plugin.system.currentTick) {
      pot.dimension.playSound("random.levelup", pot.location);
      const output = cookingData.recipeData.output;

      try {
        for (const item of output) {
          const itemStack = new ItemStack(item.typeId, item.quantity);
          const spawnedItem = pot.dimension.spawnItem(itemStack, pot.location);
          spawnedItem.applyImpulse({
            x: Math.random() * 0.2 - 0.1,
            y: 0.1,
            z: Math.random() * 0.2 - 0.1,
          });
        }
      } catch (error) {
        console.error(error);
      }
      this.cookingDataManager.removeCookingData(pot.id);
      pot.nameTag = "";
      return true;
    } else {
      return false;
    }
  }

  private updatePotNameTag(pot: Entity, cookingData?: CookingData[number]) {
    if (!cookingData) {
      pot.nameTag = "";
      return;
    }

    const isInMinigame = cookingData.minigame !== null;
    const text = isInMinigame
      ? `§cคนเพื่อดำเนินการต่อ`
      : `§7อีก §a${
        Math.ceil(cookingData.timeEndCooking - this.plugin.system.currentTick) >
            0
          ? Math.ceil(
            (cookingData.timeEndCooking - this.plugin.system.currentTick) / 20,
          )
          : 0
      } §7วินาที`;
    pot.nameTag = `§e${
      cookingData.recipeData.output[0]?.name ?? "ไม่มีสูตร"
    }\n${text}`;
  }

  private handleCookingInteraction(ev: PlayerInteractWithEntityBeforeEvent) {
    if (this.isCookingPot(ev.target)) {
      ev.cancel = true;
      system.run(() => {
        if (this.cookingDataManager.isHasCookingData(ev.target.id)) {
          return;
        }
        this.showCookingUI(
          ev.player,
          this.cookingRecipesDataManager.getAllCookingRecipes(),
          ev.target.id,
        );
      });
    }
  }

  private showCookingUI(
    player: Player,
    recipes: CookingRecipesData,
    cookingId: string,
    selectedRecipeIndex?: number,
  ) {
    if (Object.keys(recipes).length === 0) {
      PlayerUtils.sendToast(
        player,
        ``,
        "ไม่มีเมนูที่สามารถทำได้",
        "textures/items/tools/pot",
      );
      return;
    }
    const bodyText = this.adjustTextLength(
      ` เลือกเมนูที่ต้องการทำ\n${
        selectedRecipeIndex !== undefined
          ? ` คุณกำลังเลือกทำ §e${
            recipes[Object.keys(recipes)[selectedRecipeIndex]!]!.name
          }`
          : ""
      }`,
      200,
    );
    const selectedRecipe = selectedRecipeIndex !== undefined
      ? recipes[Object.keys(recipes)[selectedRecipeIndex]!]!
      : recipes[Object.keys(recipes)[0]!]!;
    const iconData = this.adjustTextLength(
      selectedRecipe.output[0]?.icon || "textures/blocks/barrier",
      150,
    );

    const foodInfo = this.adjustTextLength(
      `\n§fเมนู §e${selectedRecipe.name}§r\n§fวัตถุดิบ §e${selectedRecipe.ingredients.length}§f ชนิด\n§fเวลาทำ §b${
        selectedRecipe.timeCooking / 20
      }§f วินาที`,
      300,
    );

    const cookUi = IActionForm.createForm(
      `§c§o§o§k§r${
        selectedRecipeIndex !== undefined ? "§o§p§r" : ""
      }เมนูทำอาหาร`,
      bodyText + iconData + foodInfo,
    );

    Object.keys(recipes).forEach((recipeKey, i) => {
      const requireItems = this.getItemCount(
        recipes[recipeKey]!.ingredients.map((i) => i.typeId),
        player,
        recipes[recipeKey]!.ingredients,
      );
      const recipe = recipes[recipeKey]!;
      const isSelected = selectedRecipeIndex !== undefined &&
        i === selectedRecipeIndex;

      cookUi.addButton(
        `${isSelected ? "§j§r§m§t§r" : "§j§r"}` +
          `${recipe.name}\n${
            requireItems.require ? "§aพร้อมทำ" : "§cวัตถุดิบไม่ครบ"
          }`,
        recipe.output[0]?.icon || "textures/blocks/barrier",
        () => {
          this.showCookingUI(player, recipes, cookingId, i);
        },
      );
    });
    const requireItemSelected = this.getItemCount(
      selectedRecipe.ingredients.map((i) => i.typeId),
      player,
      selectedRecipe.ingredients,
    );

    if (selectedRecipeIndex !== undefined) {
      const selected = recipes[Object.keys(recipes)[selectedRecipeIndex]!]!;
      selected.ingredients.forEach((ingredient) => {
        const statusColors = requireItemSelected.require
          ? "§a"
          : requireItemSelected.items[ingredient.typeId]! >= ingredient.quantity
          ? "§a"
          : "§c";
        cookUi.addButton(
          this.adjustTextLength(`§i§n§g§r` + ingredient.name, 100) +
            this.adjustTextLength(
              `§f[${statusColors}${
                requireItemSelected.items[
                  ingredient.typeId
                ] || 0
              }§f/${ingredient.quantity}§f]`,
              100,
            ),
          ingredient.icon,
        );
      });
    }
    cookUi.addButton(`§c§o§o§k§l§k§rเริ่มทำอาหาร§r`, ``, () => {
      if (selectedRecipeIndex === undefined) return;
      if (requireItemSelected.require) {
        for (const ingredient of selectedRecipe.ingredients) {
          player.runCommand(
            `clear @s ${ingredient.typeId} 0 ${ingredient.quantity}`,
          );
        }

        this.startCooking(selectedRecipe, cookingId, player);
      } else {
        PlayerUtils.sendToast(
          player,
          ``,
          `วัตถุดิบไม่เพียงพอ`,
          `textures/ui/realms_red_x`,
        );
      }
    });
    system.run(() => {
      cookUi.show(player);
    });
  }

  private startCooking(
    recipeData: CookingRecipesData[string],
    cookingId: string,
    player: Player,
  ) {
    this.cookingDataManager.addCookingData(cookingId, {
      recipeData,
      minigame: null,
      timeEndCooking: this.plugin.system.currentTick + recipeData.timeCooking,
    });
    PlayerUtils.sendToast(
      player,
      ``,
      `§fเริ่มทำอาหาร §e${recipeData.name}`,
      recipeData.output[0]?.icon ?? "textures/ui/realms_red_x",
    );
  }

  public showAdvancedCookingUI(player: Player) {
    try {
      const cookUi = IActionForm.createForm(
        `เมนูทำอาหารขั้นสูง`,
        `คุณสามารถจัดการสูตรอาหารได้ที่นี่`,
      ); //
      cookUi.addButton(`ปิด`, "textures/ui/realms_red_x");
      cookUi.addButton(
        `เพิ่มสูตรอาหาร`,
        `textures/ui/color_plus`,
        () => this.showAddCookingRecipeUI(player),
      );
      cookUi.addDivider();
      const recipes = this.cookingRecipesDataManager.getAllCookingRecipes();
      Object.keys(recipes).forEach((recipeKey) => {
        const recipe = recipes[recipeKey]!;
        cookUi.addButton(
          recipe.name,
          recipe.output[0]?.icon ?? "textures/blocks/barrier",
          () => {
            this.showActionsForRecipe(player, recipeKey, recipe);
          },
        );
      });
      cookUi.show(player);
    } catch (e) {
      console.warn("Error showing advanced cooking UI:", e);
    }
  }

  private showActionsForRecipe(
    player: Player,
    recipeId: string,
    recipeData: CookingRecipesData[string],
  ) {
    const actionsUi = IActionForm.createForm(
      `จัดการสูตรอาหาร ${recipeData.name}`,
      `เลือกการกระทำที่ต้องการทำกับสูตรอาหารนี้`,
    );
    actionsUi.addButton(`แก้ไข`, `textures/ui/pencil_edit_icon`, () => {
      this.showAddCookingRecipeUI(player, {
        data: recipeData,
        id: recipeId,
      });
    });
    actionsUi.addButton(`ลบ`, `textures/ui/icon_trash`, () => {
      this.cookingRecipesDataManager.removeCookingRecipe(recipeId);
      PlayerUtils.sendToast(
        player,
        ``,
        `ลบสูตรอาหาร ${recipeData.name} เรียบร้อย`,
        "textures/ui/check",
      );
      this.showAdvancedCookingUI(player);
    });
    actionsUi.addDivider();
    actionsUi.addButton(`เพิ่มวัตถุดิบ`, `textures/ui/color_plus`, () => {
      this.showAddIngredientUI(player, recipeId);
    });
    for (const ingredient of recipeData.ingredients) {
      actionsUi.addButton(
        `${ingredient.name} [${ingredient.quantity}x]`,
        ingredient.icon,
        () => {
          this.cookingRecipesDataManager.removeIngredientFromRecipe(
            recipeId,
            recipeData.ingredients.indexOf(ingredient),
          );
          PlayerUtils.sendToast(
            player,
            ``,
            `ลบวัตถุดิบ ${ingredient.name} เรียบร้อย`,
            ingredient.icon,
          );
          this.showActionsForRecipe(
            player,
            recipeId,
            this.cookingRecipesDataManager.getCookingRecipe(recipeId)!,
          );
        },
      );
    }
    actionsUi.addDivider();
    actionsUi.addButton(
      `เพิ่มผลลัพธ์`,
      `textures/ui/color_plus`,
      () => this.showAddOutputUI(player, recipeId),
    );
    for (const output of recipeData.output) {
      actionsUi.addButton(
        `${output.name} [${output.quantity}x]`,
        output.icon,
        () => {
          this.cookingRecipesDataManager.removeOutputFromRecipe(
            recipeId,
            recipeData.output.indexOf(output),
          );
          PlayerUtils.sendToast(
            player,
            ``,
            `ลบผลลัพธ์ ${output.name} เรียบร้อย`,
            output.icon,
          );
          this.showActionsForRecipe(
            player,
            recipeId,
            this.cookingRecipesDataManager.getCookingRecipe(recipeId)!,
          );
        },
      );
    }
    actionsUi.show(player);
  }

  private showAddOutputUI(player: Player, recipeId: string) {
    const addOutputUi = IModalForm.createForm(
      `เพิ่มผลลัพธ์`,
      `กรอกข้อมูลผลลัพธ์ที่ต้องการเพิ่ม`,
    );
    const formData = {
      typeId: "",
      name: "",
      icon: "",
      quantity: 1,
    };

    addOutputUi.addTextField(
      {
        label: "ไอดีของผลลัพธ์",
        placeholderText: "เช่น minecraft:cooked_porkchop",
      },
      (value) => (formData.typeId = value),
    );

    addOutputUi.addTextField(
      {
        label: "ชื่อผลลัพธ์",
        placeholderText: "เช่น หมู",
      },
      (value) => (formData.name = value),
    );

    addOutputUi.addTextField(
      {
        label: "ไอคอนผลลัพธ์",
        placeholderText: "เช่น textures/items/cooked_porkchop",
      },
      (value) => (formData.icon = value),
    );
    addOutputUi.addSlider(
      {
        label: "จำนวนผลลัพธ์",
        minimumValue: 1,
        maximumValue: 64,
        valueStep: 1,
        defaultValue: 1,
      },
      (value) => (formData.quantity = value),
    );
    addOutputUi.show(player).then((res) => {
      if (!res) return;
      if (res.canceled) return;
      this.cookingRecipesDataManager.addOutputToRecipe(recipeId, formData);
      PlayerUtils.sendToast(
        player,
        ``,
        `เพิ่มผลลัพธ์ ${formData.name} เรียบร้อย`,
        "textures/ui/check",
      );
      this.showActionsForRecipe(
        player,
        recipeId,
        this.cookingRecipesDataManager.getCookingRecipe(recipeId)!,
      );
    });
  }

  private showAddIngredientUI(player: Player, recipeId: string) {
    const addIngredientUi = IModalForm.createForm(
      `เพิ่มวัตถุดิบ`,
      `กรอกข้อมูลวัตถุดิบที่ต้องการเพิ่ม`,
    );
    const formData = {
      typeId: "",
      name: "",
      icon: "",
      quantity: 1,
    };
    addIngredientUi.addTextField(
      {
        label: "ไอดีของวัตถุดิบ",
        placeholderText: "เช่น minecraft:cooked_porkchop",
      },
      (value) => (formData.typeId = value),
    );
    addIngredientUi.addTextField(
      {
        label: "ชื่อวัตถุดิบ",
        placeholderText: "เช่น หมู",
      },
      (value) => (formData.name = value),
    );
    addIngredientUi.addTextField(
      {
        label: "ไอคอนวัตถุดิบ",
        placeholderText: "เช่น textures/items/cooked_porkchop",
      },
      (value) => (formData.icon = value),
    );
    addIngredientUi.addSlider(
      {
        label: "จำนวนวัตถุดิบ",
        minimumValue: 1,
        maximumValue: 64,
        valueStep: 1,
        defaultValue: 1,
      },
      (value) => (formData.quantity = value),
    );
    addIngredientUi.show(player).then((res) => {
      if (!res) return;
      if (res.canceled) return;
      this.cookingRecipesDataManager.addIngredientToRecipe(recipeId, formData);
      PlayerUtils.sendToast(
        player,
        ``,
        `เพิ่มวัตถุดิบ ${formData.name} เรียบร้อย`,
        "textures/ui/check",
      );
      this.showActionsForRecipe(
        player,
        recipeId,
        this.cookingRecipesDataManager.getCookingRecipe(recipeId)!,
      );
    });
  }

  private showAddCookingRecipeUI(
    player: Player,
    edit?: {
      data: CookingRecipesData[string];
      id: string;
    },
  ) {
    const addCookingRecipeUi = IModalForm.createForm(
      edit ? `แก้ไขสูตรอาหาร` : `เพิ่มสูตรอาหาร`,
      edit ? `เเก้ไข` : `เพิ่ม`,
    );

    const formData = {
      name: edit ? edit.data.name : "",
      timeCooking: edit ? edit.data.timeCooking : 0,
      ingredients: edit ? edit.data.ingredients : [],
      output: edit ? edit.data.output : [],
    };

    addCookingRecipeUi.addLabel(`กรอกข้อมูลสูตรอาหารให้ครบถ้วน`);
    addCookingRecipeUi.addTextField(
      {
        label: "ชื่อสูตรอาหาร",
        placeholderText: "เช่น ลาบ",
        defaultValue: edit ? edit.data.name : "",
      },
      (value) => (formData.name = value),
    );
    addCookingRecipeUi.addTextField(
      {
        label: "เวลาทำอาหาร (วินาที)",
        placeholderText: "เช่น 10",
        defaultValue: edit ? (edit.data.timeCooking / 20).toString() : "",
      },
      (value) => (formData.timeCooking = parseInt(value) * 20),
    );
    addCookingRecipeUi.show(player).then((res) => {
      if (!res) return;
      if (res.canceled) return;

      const recipeId = edit ? edit.id : this.generateRandomId();
      this.cookingRecipesDataManager.addCookingRecipe(recipeId, {
        name: formData.name,
        timeCooking: formData.timeCooking,
        ingredients: formData.ingredients,
        output: formData.output,
      });
      PlayerUtils.sendToast(
        player,
        ``,
        `บันทึกสูตรอาหาร ${formData.name} เรียบร้อย`,
        "textures/ui/check",
      );
      this.showAdvancedCookingUI(player);
    });
  }

  //make type return like {itemId: number}
  private getItemCount(
    itemId: string[],
    pl: Player,
    requires: { typeId: string; quantity: number }[],
  ) {
    const results: {
      require: boolean;
      items: { [key: string]: number };
    } = {
      require: true,
      items: {},
    };

    const inventory = pl.getComponent("minecraft:inventory")?.container;
    if (!inventory) return results;

    for (let i = 0; i < inventory.size; i++) {
      const itemStack = inventory.getItem(i);
      if (!itemStack) continue;
      if (itemId.includes(itemStack.typeId)) {
        if (!results.items[itemStack.typeId]) {
          results.items[itemStack.typeId] = 0;
        }
        results.items[itemStack.typeId]! += itemStack.amount;
      }
    }

    for (const req of requires) {
      if (
        !results.items[req.typeId] ||
        results.items[req.typeId]! < req.quantity
      ) {
        results.require = false;
        break;
      }
    }

    return results;
  }

  private generateRandomId() {
    return Math.random()
      .toString(36)
      .substring(2, 10);
  }

  private adjustTextLength(text = "", totalLength = 100) {
    return text.slice(0, totalLength).padEnd(totalLength, "\t");
  }
}

export { CookingManager };
