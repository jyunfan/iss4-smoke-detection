export const SENSOR_PROVIDERS = ["purpleair", "airgradient"] as const;

export type SensorProvider = (typeof SENSOR_PROVIDERS)[number];

export const SENSOR_PROVIDER_LABELS: Record<SensorProvider, string> = {
  purpleair: "PurpleAir",
  airgradient: "AirGradient"
};

export function getSensorProviderLabel(provider: string) {
  return SENSOR_PROVIDER_LABELS[provider as SensorProvider] ?? provider;
}
