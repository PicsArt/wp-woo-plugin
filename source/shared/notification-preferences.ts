export const notificationCategories = {
  suggestions: 'Content suggestions and promotion ideas',
  setup: 'Account setup and connection',
  started: 'Generation started',
  delayed: 'Delays and status checks',
  ready: 'Images and videos ready',
  exports: 'WordPress copies and product updates',
  attention: 'Failed or uncertain requests',
  support: 'Support replies and service updates',
} as const;
export type NotificationCategory = keyof typeof notificationCategories;
export type NotificationPreferences = Record<NotificationCategory, boolean>;
export function notificationPreferences(saved: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return Object.fromEntries(Object.keys(notificationCategories).map(k => [k, saved[k as NotificationCategory] !== false])) as NotificationPreferences;
}
export function notificationAllowed(saved: Partial<NotificationPreferences> | undefined, category: NotificationCategory) {
  return notificationPreferences(saved)[category];
}
