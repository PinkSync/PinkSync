/**
 * PinkSync Platform Configuration
 * 
 * Multi-environment configuration for PinkSync platform
 * Supports: standalone, extension, embedded, api, signal, notificator
 */

import { env } from '@/lib/env.ts';

export type PlatformEnvironment = 
  | 'standalone'    // Full web application
  | 'extension'     // Browser extension
  | 'embedded'      // Widget for third-party sites
  | 'api'           // Headless API mode
  | 'signal'        // Signal processing system
  | 'notificator';  // Notification engine

export interface PlatformConfig {
  environment: PlatformEnvironment;
  features: {
    deafAuth: boolean;
    eventOrchestrator: boolean;
    ragEngine: boolean;
    backgroundWorkers: boolean;
    apiBroker: boolean;
    pinkFlow: boolean;
    signalSystem: boolean;
    notificator: boolean;
    aslGlosser: boolean;
    vcode: boolean;
    interpreters: boolean;
  };
  services: {
    apiBaseUrl: string;
    ragDatabaseUrl?: string;
    vectorDbUrl?: string;
    workerQueueUrl?: string;
    signalServiceUrl?: string;
  };
  mbtqIntegration: {
    enabled: boolean;
    apiUrl?: string;
    sharedAuth: boolean;
  };
  accessibility: {
    simplifyText: boolean;
    visualEnhancements: boolean;
    signLanguage: boolean;
    transcription: boolean;
    customPreferences: boolean;
  };
  deployment: {
    vercelDisabled: boolean;
    standalone: boolean;
  };
}

const defaultConfig: PlatformConfig = {
  environment: 'standalone',
  features: {
    deafAuth: true,
    eventOrchestrator: true,
    ragEngine: true,
    backgroundWorkers: true,
    apiBroker: true,
    pinkFlow: true,
    signalSystem: true,
    notificator: true,
    aslGlosser: true,
    vcode: true,
    interpreters: true,
  },
  services: {
    apiBaseUrl: env.get("API_URL") || '/api',
    ragDatabaseUrl: env.get("RAG_DATABASE_URL"),
    vectorDbUrl: env.get("VECTOR_DB_URL"),
    workerQueueUrl: env.get("WORKER_QUEUE_URL"),
    signalServiceUrl: env.get("SIGNAL_SERVICE_URL"),
  },
  mbtqIntegration: {
    enabled: true,
    apiUrl: env.get("MBTQ_API_URL"),
    sharedAuth: true,
  },
  accessibility: {
    simplifyText: true,
    visualEnhancements: true,
    signLanguage: true,
    transcription: true,
    customPreferences: true,
  },
  deployment: {
    vercelDisabled: true,
    standalone: true,
  },
};

/**
 * Get configuration for specific environment
 */
export function getPlatformConfig(environment?: PlatformEnvironment): PlatformConfig {
  const envVar = environment || (env.get("PLATFORM_ENV") as PlatformEnvironment) || 'standalone';
  
  // Environment-specific overrides
  const envConfigs: Partial<Record<PlatformEnvironment, Partial<PlatformConfig>>> = {
    extension: {
      features: {
        ...defaultConfig.features,
        signalSystem: true,
        notificator: true,
      },
    },
    embedded: {
      features: {
        ...defaultConfig.features,
        deafAuth: false, // Use parent site auth
        eventOrchestrator: true,
        pinkFlow: true,
      },
    },
    api: {
      features: {
        ...defaultConfig.features,
        eventOrchestrator: true,
        backgroundWorkers: true,
        apiBroker: true,
      },
    },
    signal: {
      features: {
        ...defaultConfig.features,
        signalSystem: true,
        eventOrchestrator: true,
        notificator: true,
      },
    },
    notificator: {
      features: {
        ...defaultConfig.features,
        notificator: true,
        signalSystem: true,
        eventOrchestrator: true,
      },
    },
  };

  return {
    ...defaultConfig,
    environment: envVar,
    ...(envConfigs[envVar] || {}),
  };
}

export const platformConfig = getPlatformConfig();

export default platformConfig;
