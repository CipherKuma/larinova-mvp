import { useLocale } from "next-intl";
import { getLocale } from "next-intl/server";

/**
 * Client hook: returns a function that resolves a locale-scoped asset path.
 * Usage:
 *   const asset = useLocaleAsset();
 *   <img src={asset('onboarding/step1-motivation.jpg')} />
 * Resolves to `/in/onboarding/step1-motivation.jpg` on the Indian locale.
 */
export function useLocaleAsset() {
  const locale = useLocale();
  return (path: string) => `/${locale}/${path.replace(/^\/+/, "")}`;
}

/**
 * Server helper: async version for server components.
 */
export async function getLocaleAsset(path: string): Promise<string> {
  const locale = await getLocale();
  return `/${locale}/${path.replace(/^\/+/, "")}`;
}

/**
 * Shared asset helper — resolves to /shared/... regardless of locale.
 * Use for logos, icons, brand assets.
 */
export function sharedAsset(path: string): string {
  return `/shared/${path.replace(/^\/+/, "")}`;
}
