/**
 * Icon utilities re-exported from the Iconify-based icon infrastructure.
 *
 * All icon rendering goes through `@iconify/react`.
 * Icon names are kebab-case (e.g., "chevron-down").
 * Legacy PascalCase names ("ChevronDown") are auto-converted by `lucideIcon()`.
 *
 * Use `DynamicIcon` from `@/components/ui/icon-picker` for dynamic rendering,
 * or import `Icon` from `@iconify/react` directly.
 */

export {
  getLucideIconNames,
  lucideIcon,
  lucidePrefix,
  pascalToKebab,
} from '@/lib/iconify';
