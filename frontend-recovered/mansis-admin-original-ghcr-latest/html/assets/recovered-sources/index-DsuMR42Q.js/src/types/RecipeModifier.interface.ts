import { StockUnit } from './stock';

export type ModifierType =
  | 'SCALE_RECIPE'
  | 'ADD_INGREDIENT'
  | 'REMOVE_INGREDIENT'
  | 'SUBSTITUTE_INGREDIENT';

export const MODIFIER_TYPES: ModifierType[] = [
  'SCALE_RECIPE',
  'ADD_INGREDIENT',
  'REMOVE_INGREDIENT',
  'SUBSTITUTE_INGREDIENT'
];

export interface ModifierFormData {
  id?: number;
  attributeOptionId: number;
  modifierType: ModifierType | '';
  scaleMultiplier?: number;
  addIngredientId?: number;
  addQuantity?: number;
  addUnit?: StockUnit;
  removeIngredientId?: number;
  substituteFromId?: number;
  substituteToId?: number;
  substituteQuantity?: number;
  substituteUnit?: StockUnit;
}

export interface RecipeModifier {
  id: number;
  attributeOptionId: number;
  recipeId: number;
  modifierType: ModifierType;
  scaleMultiplier?: number | null;
  addIngredientId?: number | null;
  addQuantity?: number | null;
  addUnit?: StockUnit | null;
  removeIngredientId?: number | null;
  substituteFromId?: number | null;
  substituteToId?: number | null;
  substituteQuantity?: number | null;
  substituteUnit?: StockUnit | null;
  createdAt: string;
  updatedAt: string;
  attributeOption?: {
    id: number;
    name: string;
    attributeId: number;
  };
  addIngredient?: {
    id: number;
    name: string;
  } | null;
  removeIngredient?: {
    id: number;
    ingredientProductId: number;
    ingredientProduct: {
      id: number;
      name: string;
    };
  } | null;
  substituteFrom?: {
    id: number;
    ingredientProductId: number;
    ingredientProduct: {
      id: number;
      name: string;
    };
  } | null;
  substituteTo?: {
    id: number;
    name: string;
  } | null;
}

export interface CreateModifierDto {
  attributeOptionId: number;
  recipeId: number;
  modifierType: ModifierType;
  scaleMultiplier?: number;
  addIngredientId?: number;
  addQuantity?: number;
  addUnit?: StockUnit;
  removeIngredientId?: number;
  substituteFromId?: number;
  substituteToId?: number;
  substituteQuantity?: number;
  substituteUnit?: StockUnit;
}

export interface UpdateModifierDto {
  modifierType?: ModifierType;
  scaleMultiplier?: number;
  addIngredientId?: number;
  addQuantity?: number;
  addUnit?: StockUnit;
  removeIngredientId?: number;
  substituteFromId?: number;
  substituteToId?: number;
  substituteQuantity?: number;
  substituteUnit?: StockUnit;
}

export interface EffectiveIngredient {
  ingredientProductId: number;
  ingredientName: string;
  quantity: number;
  unit: StockUnit;
  baseQuantity: number;
  appliedModifiers: string[];
}
