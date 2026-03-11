interface CookingData {
  [key: string]: {
    recipeData: RecipeData;
    minigame: number | null;
    timeEndCooking: number;
  };
}

interface CookingRecipesData {
  [key: string]: RecipeData;
}

interface RecipeData {
  name: string;
  ingredients: {
    typeId: string;
    icon: string;
    quantity: number;
    name: string;
  }[];
  output: {
    typeId: string;
    icon: string;
    quantity: number;
    name: string;
  }[];
  timeCooking: number;
}

export type { CookingData, CookingRecipesData, RecipeData };
