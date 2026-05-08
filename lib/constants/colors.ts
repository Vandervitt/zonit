export const PlatformColors = {
  whatsapp: '#25d366',
  telegram: '#0088cc',
} as const;

export function ctaThemeColor(channel: string | undefined, fallback: string): string {
  if (channel === 'whatsapp') return PlatformColors.whatsapp;
  if (channel === 'telegram') return PlatformColors.telegram;
  return fallback;
}
