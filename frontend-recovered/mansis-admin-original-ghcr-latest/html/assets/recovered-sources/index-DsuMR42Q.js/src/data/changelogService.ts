import { apiClient } from './apiService';
import { CHANGELOG } from './endpoints';
import type {
  ChangelogRelease,
  ChangelogApp,
  ChangelogCategory
} from '@/types/ChangelogRelease.interface';

export interface ChangelogItemDto {
  category: ChangelogCategory;
  title: string;
  description: string;
  sortOrder?: number;
}

export interface CreateChangelogReleaseDto {
  app: ChangelogApp;
  version: string;
  date: string;
  sortOrder?: number;
  items: ChangelogItemDto[];
}

export interface UpdateChangelogReleaseDto {
  app?: ChangelogApp;
  version?: string;
  date?: string;
  sortOrder?: number;
  items?: ChangelogItemDto[];
}

export async function fetchChangelog(
  app: ChangelogApp
): Promise<ChangelogRelease[]> {
  const response = await apiClient.get<ChangelogRelease[]>(CHANGELOG, {
    app
  });
  return response.data ?? [];
}

export async function fetchAllChangelog(): Promise<ChangelogRelease[]> {
  const response = await apiClient.get<ChangelogRelease[]>(`${CHANGELOG}/all`);
  return response.data ?? [];
}

export async function createChangelogRelease(
  dto: CreateChangelogReleaseDto
): Promise<ChangelogRelease> {
  const response = await apiClient.post<ChangelogRelease>(CHANGELOG, dto);
  return response.data;
}

export async function updateChangelogRelease(
  id: number,
  dto: UpdateChangelogReleaseDto
): Promise<ChangelogRelease> {
  const response = await apiClient.patch<ChangelogRelease>(
    `${CHANGELOG}/${id}`,
    dto
  );
  return response.data;
}

export async function deleteChangelogRelease(id: number): Promise<void> {
  await apiClient.delete(`${CHANGELOG}/${id}`);
}

export async function bulkDeleteChangelogReleases(
  ids: number[]
): Promise<{ deletedCount: number }> {
  const response = await apiClient.delete<{ deletedCount: number }>(
    `${CHANGELOG}/bulk`,
    { data: { ids } }
  );
  return response.data;
}
