/**
 * Combines multiple class names into a single string, filtering out falsy values
 */
export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
} 