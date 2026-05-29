import { addCollection } from '@iconify/react';

import type { IconifyJSON } from '@iconify/types';

const lucidePrefix = 'lucide';

let iconNamesCache: string[] = [];

/**
 * Initialize Iconify with the full Lucide icon set.
 * Uses dynamic import so Rspack code-splits the ~600KB JSON into a separate chunk.
 * Must be called before rendering the app.
 */
const initIcons = async (): Promise<void> => {
  const data: IconifyJSON = (await import('@iconify-json/lucide/icons.json'))
    .default;
  addCollection(data);
  iconNamesCache = Object.keys(data.icons).sort((a, b) => a.localeCompare(b));
};

/**
 * Get all available Lucide icon names in kebab-case (e.g., "chevron-down").
 * Empty before `initIcons()` resolves.
 */
const getLucideIconNames = (): string[] => iconNamesCache;

/**
 * Convert PascalCase to kebab-case for Iconify lookup.
 * Handles names like "ChevronsUpDown" → "chevrons-up-down",
 * "Building2" → "building-2", "Gauge120" → "gauge-120".
 * If the name already contains hyphens, returns it as-is.
 */
const pascalToKebab = (name: string): string => {
  if (name.includes('-')) return name;
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-zA-Z])(\d)/g, '$1-$2')
    .toLowerCase();
};

/**
 * Build the full Iconify icon reference string.
 * Accepts both PascalCase ("Home") and kebab-case ("home").
 */
const lucideIcon = (name: string): string =>
  `${lucidePrefix}:${pascalToKebab(name)}`;

export {
  getLucideIconNames,
  initIcons,
  lucideIcon,
  lucidePrefix,
  pascalToKebab,
};
