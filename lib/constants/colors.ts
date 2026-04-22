export const PlatformColors = {
  whatsapp: '#25d366',
  telegram: '#0088cc',
} as const;

export function ctaThemeColor(theme: string | undefined, fallback: string): string {
  if (theme === 'whatsapp') return PlatformColors.whatsapp;
  if (theme === 'telegram') return PlatformColors.telegram;
  return fallback;
}
