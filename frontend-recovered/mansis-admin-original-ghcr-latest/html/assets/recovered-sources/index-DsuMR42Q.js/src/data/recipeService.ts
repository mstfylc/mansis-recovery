import { apiClient } from './apiService';
import { Recipe, RecipeIngredient } from '@/types/Recipe.interface';
import {
  RecipeModifier,
  CreateModifierDto,
  UpdateModifierDto,
  EffectiveIngredient
} from '@/types/RecipeModifier.interface';
import { RECIPES, RECIPE_MODIFIERS, RECIPE_MODIFIER_DETAIL } from './endpoints';

export interface RecipesResponse {
  items: Recipe[];
  total: number;
  page: number;
  limit: number;
}

export interface RecipeFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  categoryId?: number;
  companyId?: number;
  startDate?: string;
  endDate?: string;
  getAll?: boolean;
}

export interface BulkDeleteResponse {
  success: boolean;
  message: string;
  deletedCount: number;
}

export const recipeService = {
  async getAll(filters: RecipeFilters = {}): Promise<RecipesResponse> {
    const response = await apiClient.get<RecipesResponse>(RECIPES, filters);
    return response.data;
  },

  async getById(id: number): Promise<Recipe> {
    const response = await apiClient.get<Recipe>(`${RECIPES}/${id}`);
    return response.data;
  },

  async create(data: Partial<Recipe>): Promise<Recipe> {
    const response = await apiClient.post<Recipe>(RECIPES, data);
    return response.data;
  },

  async update(id: number, data: Partial<Recipe>): Promise<Recipe> {
    const response = await apiClient.patch<Recipe>(`${RECIPES}/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`${RECIPES}/${id}`);
  },

  async bulkDelete(ids: number[]): Promise<void> {
    await apiClient.post(`${RECIPES}/bulk-delete`, { ids });
  },

  async bulkDeleteByIds(recipeIds: number[]): Promise<void> {
    await apiClient.post(`${RECIPES}/delete`, { recipeIds });
  },

  async bulkUpdateStatus(
    recipeIds: number[],
    isActive: boolean
  ): Promise<void> {
    await apiClient.post(`${RECIPES}/update-status`, { recipeIds, isActive });
  },

  async addIngredient(
    recipeId: number,
    ingredientData: Partial<RecipeIngredient>
  ): Promise<RecipeIngredient> {
    const response = await apiClient.post<RecipeIngredient>(
      `${RECIPES}/${recipeId}/ingredients`,
      ingredientData
    );
    return response.data;
  },

  async updateIngredient(
    recipeId: number,
    ingredientId: number,
    data: Partial<RecipeIngredient>
  ): Promise<RecipeIngredient> {
    const response = await apiClient.patch<RecipeIngredient>(
      `${RECIPES}/${recipeId}/ingredients/${ingredientId}`,
      data
    );
    return response.data;
  },

  async deleteIngredient(
    recipeId: number,
    ingredientId: number
  ): Promise<void> {
    await apiClient.delete(
      `${RECIPES}/${recipeId}/ingredients/${ingredientId}`
    );
  },

  async bulkDeleteIngredients(
    recipeId: number,
    ingredientIds: number[]
  ): Promise<BulkDeleteResponse> {
    const response = await apiClient.post<BulkDeleteResponse>(
      `${RECIPES}/${recipeId}/ingredients/bulk-delete`,
      { ingredientIds }
    );
    return response.data;
  },

  // Recipe Modifier methods
  async getModifiers(
    recipeId: number,
    attributeOptionId?: number
  ): Promise<RecipeModifier[]> {
    const endpoint = RECIPE_MODIFIERS.replace(':recipeId', recipeId.toString());
    const params = attributeOptionId ? { attributeOptionId } : {};
    const response = await apiClient.get<RecipeModifier[]>(endpoint, params);
    return response.data;
  },

  async createModifier(
    recipeId: number,
    data: CreateModifierDto
  ): Promise<RecipeModifier> {
    const endpoint = RECIPE_MODIFIERS.replace(':recipeId', recipeId.toString());
    const response = await apiClient.post<RecipeModifier>(endpoint, {
      ...data,
      recipeId // Ensure recipeId is included
    });
    return response.data;
  },

  async updateModifier(
    recipeId: number,
    modifierId: number,
    data: UpdateModifierDto
  ): Promise<RecipeModifier> {
    const endpoint = RECIPE_MODIFIER_DETAIL.replace(
      ':recipeId',
      recipeId.toString()
    ).replace(':modifierId', modifierId.toString());
    const response = await apiClient.put<RecipeModifier>(endpoint, data);
    return response.data;
  },

  async deleteModifier(recipeId: number, modifierId: number): Promise<void> {
    const endpoint = RECIPE_MODIFIER_DETAIL.replace(
      ':recipeId',
      recipeId.toString()
    ).replace(':modifierId', modifierId.toString());
    await apiClient.delete(endpoint);
  },

  async calculateEffectiveIngredients(
    recipeId: number,
    selections: { attributeId: number; optionId: number }[]
  ): Promise<EffectiveIngredient[]> {
    const response = await apiClient.post<EffectiveIngredient[]>(
      `${RECIPES}/${recipeId}/calculate-effective-ingredients`,
      { selections }
    );
    return response.data;
  }
};
