/**
 * Changelog enum constants - mirrors backend Prisma enums.
 * Single source of truth for changelog app and category values.
 */

export const ChangelogApp = {
  ADMIN: 'ADMIN',
  POS: 'POS'
} as const;

export const ChangelogCategory = {
  FEATURE: 'feature',
  IMPROVEMENT: 'improvement',
  FIX: 'fix'
} as const;

export type ChangelogAppType = (typeof ChangelogApp)[keyof typeof ChangelogApp];
export type ChangelogCategoryType =
  (typeof ChangelogCategory)[keyof typeof ChangelogCategory];

export const CHANGELOG_APPS: ChangelogAppType[] = [
  ChangelogApp.ADMIN,
  ChangelogApp.POS
];

export const CHANGELOG_CATEGORIES: ChangelogCategoryType[] = [
  ChangelogCategory.FEATURE,
  ChangelogCategory.IMPROVEMENT,
  ChangelogCategory.FIX
];
