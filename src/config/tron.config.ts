export interface EnvironmentVariables {
  MONGODB_URI: string;
  TRON_FULL_NODE: string;
  TRON_SOLIDITY_NODE: string;
  TRON_EVENT_SERVER: string;
  TRON_PRIVATE_KEY: string;
  ENCRYPTION_KEY: string;
  ENCRYPTION_IV: string;
  TRON_EVENT_SERVER_URL: string;
  TRON_API_KEY: string;

  // Add new fields for monitoring
  TRON_MONITORED_ADDRESSES?: string; // comma-separated addresses
}

export function validateConfig(config: Record<string, unknown>) {
  const requiredFields: (keyof EnvironmentVariables)[] = [
    'MONGODB_URI',
    'TRON_FULL_NODE',
    'TRON_SOLIDITY_NODE',
    'TRON_EVENT_SERVER',
    'TRON_PRIVATE_KEY',
    'ENCRYPTION_KEY',
    'TRON_EVENT_SERVER_URL',
    'ENCRYPTION_IV',
    'TRON_API_KEY',
  ];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Configuration error: ${field} is required`);
    }
  }

  // Optional validation for monitored addresses
  if (
    config.TRON_MONITORED_ADDRESSES &&
    typeof config.TRON_MONITORED_ADDRESSES !== 'string'
  ) {
    throw new Error(
      'Configuration error: TRON_MONITORED_ADDRESSES must be a comma-separated string',
    );
  }

  return config;
}
