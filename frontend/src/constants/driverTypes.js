export const DRIVER_TYPES = {
  convencional: { value: 'convencional', label: 'Motorista Convencional', icon: '🚗', badgeClass: 'badge-gray', showTag: false },
  app_uber: { value: 'app_uber', label: 'Motorista de App — Uber', icon: '🚘', badgeClass: 'badge-app-uber', showTag: true, tagLabel: 'Uber' },
  app_99: { value: 'app_99', label: 'Motorista de App — 99', icon: '🚘', badgeClass: 'badge-app-99', showTag: true, tagLabel: '99' },
  app_outro: { value: 'app_outro', label: 'Motorista de App — Outro', icon: '🚘', badgeClass: 'badge-app-outro', showTag: true, tagLabel: 'App' },
};

export const DRIVER_TYPE_OPTIONS = Object.values(DRIVER_TYPES).map(({ value, label }) => ({ value, label }));
