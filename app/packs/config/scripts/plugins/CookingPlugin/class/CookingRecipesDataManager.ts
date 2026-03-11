import { PluginBase } from "@axeth/api";
import type { CookingRecipesData } from "../types/CookingData.ts";

class CookingRecipesDataManager {
  private plugin: PluginBase;

  constructor(plugin: PluginBase) {
    this.plugin = plugin;
  }

  get data() {
    return JSON.parse(
      this.plugin.config.get()["cookingRecipes"]!.value as string,
    ) as CookingRecipesData;
  }

  public addCookingRecipe(
    cookingId: string,//
    cookingRecipe: CookingRecipesData[string],
  ) {
    const currentData = this.data;
    currentData[cookingId] = cookingRecipe;
    this.updateCookingRecipes(currentData);
  }

  public addIngredientToRecipe(
    cookingId: string,
    ingredient: CookingRecipesData[string]["ingredients"][number],
  ) {
    const currentData = this.data;
    currentData[cookingId]!.ingredients.push(ingredient);
    this.updateCookingRecipes(currentData);
  }

  public removeIngredientFromRecipe(
    cookingId: string,
    ingredientIndex: number,
  ) {
    const currentData = this.data;
    currentData[cookingId]!.ingredients.splice(ingredientIndex, 1);
    this.updateCookingRecipes(currentData);
  }

  public addOutputToRecipe(
    cookingId: string,
    output: CookingRecipesData[string]["output"][number],
  ) {
    const currentData = this.data;
    currentData[cookingId]!.output.push(output);
    this.updateCookingRecipes(currentData);
  }

  public removeOutputFromRecipe(cookingId: string, outputIndex: number) {
    const currentData = this.data;
    currentData[cookingId]!.output.splice(outputIndex, 1);
    this.updateCookingRecipes(currentData);
  }

  public removeCookingRecipe(cookingId: string) {
    const currentData = this.data;
    delete currentData[cookingId];
    this.updateCookingRecipes(currentData);
  }

  public getCookingRecipe(cookingId: string) {
    return this.data[cookingId];
  }

  public getAllCookingRecipes() {
    return this.data;
  }

  public editCookingRecipe(
    cookingId: string,
    newCookingRecipe: Partial<CookingRecipesData[string]>,
  ) {
    const currentData = this.data;
    currentData[cookingId] = { ...currentData[cookingId], ...newCookingRecipe } as CookingRecipesData[string];
    this.updateCookingRecipes(currentData);
  }

  public updateCookingRecipes(newData: CookingRecipesData) {
    const config = this.plugin.config.get();
    config["cookingRecipes"]!.value = JSON.stringify(newData);
    this.plugin.config.set(config);
  }
}

export { CookingRecipesDataManager };
