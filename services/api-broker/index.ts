/**
 * API Broker
 * 
 * Unified gateway for connecting with service providers and partners.
 * Acts as a broker to match deaf users with relevant services, products, and programs.
 */

import { ServiceProvider, ProviderType, ProviderCapability } from '@/types/index.ts';
import { events } from '@/services/event-orchestrator/index.ts';

class ApiBroker {
  private providers: Map<string, ServiceProvider> = new Map();
  private connections: Map<string, any> = new Map(); // Active connections

  /**
   * Register a service provider
   */
  async registerProvider(provider: Omit<ServiceProvider, 'id'>): Promise<string> {
    const id = this.generateProviderId();
    const fullProvider: ServiceProvider = {
      id,
      ...provider,
    };

    this.providers.set(id, fullProvider);

    // Emit provider update event
    await events.providerUpdate('api', {
      action: 'register',
      providerId: id,
      providerName: provider.name,
    });

    return id;
  }

  /**
   * Get provider by ID
   */
  getProvider(id: string): ServiceProvider | null {
    return this.providers.get(id) || null;
  }

  /**
   * Get all providers
   */
  getAllProviders(): ServiceProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: ProviderType): ServiceProvider[] {
    return Array.from(this.providers.values()).filter(p => p.type === type);
  }

  /**
   * Search providers
   */
  searchProviders(query: string, type?: ProviderType): ServiceProvider[] {
    const searchTerms = query.toLowerCase().split(' ');
    let results = Array.from(this.providers.values());

    // Filter by type if specified
    if (type) {
      results = results.filter(p => p.type === type);
    }

    // Filter by search terms
    results = results.filter(provider => {
      const searchText = `${provider.name} ${provider.description}`.toLowerCase();
      return searchTerms.some(term => searchText.includes(term));
    });

    // Sort by accessibility score
    results.sort((a, b) => b.accessibilityScore - a.accessibilityScore);

    return results;
  }

  /**
   * Match providers to user needs
   */
  async matchProviders(
    userId: string,
    needs: {
      type?: ProviderType;
      keywords?: string[];
      minAccessibilityScore?: number;
    }
  ): Promise<ServiceProvider[]> {
    let candidates = Array.from(this.providers.values());

    // Filter by type
    if (needs.type) {
      candidates = candidates.filter(p => p.type === needs.type);
    }

    // Filter by accessibility score
    if (needs.minAccessibilityScore !== undefined) {
      candidates = candidates.filter(p => p.accessibilityScore >= needs.minAccessibilityScore!);
    }

    // Filter by keywords
    if (needs.keywords && needs.keywords.length > 0) {
      candidates = candidates.filter(provider => {
        const searchText = `${provider.name} ${provider.description} ${provider.capabilities.map(c => c.name).join(' ')}`.toLowerCase();
        return needs.keywords!.some(keyword => searchText.includes(keyword.toLowerCase()));
      });
    }

    // Sort by accessibility score
    candidates.sort((a, b) => b.accessibilityScore - a.accessibilityScore);

    // Emit service request event
    await events.serviceRequest(userId, 'api', {
      action: 'match',
      needs,
      resultCount: candidates.length,
    });

    return candidates;
  }

  /**
   * Call provider API
   */
  async callProviderApi(
    providerId: string,
    capability: string,
    parameters: Record<string, any>
  ): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const cap = provider.capabilities.find(c => c.name === capability);
    if (!cap) {
      throw new Error(`Capability ${capability} not found for provider ${providerId}`);
    }

    // In production, make actual API call
    // For now, simulate response
    return {
      success: true,
      provider: provider.name,
      capability: cap.name,
      data: {
        message: `Simulated response from ${provider.name}`,
        parameters,
      },
    };
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(providerId: string, active: boolean): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    provider.active = active;

    // Emit provider update event
    await events.providerUpdate('api', {
      action: 'status_update',
      providerId,
      active,
    });

    return true;
  }

  /**
   * Update provider accessibility score
   */
  async updateAccessibilityScore(providerId: string, score: number): Promise<boolean> {
    const provider = this.providers.get(providerId);
    if (!provider) return false;

    provider.accessibilityScore = Math.max(0, Math.min(100, score));

    return true;
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerId: string) {
    const provider = this.providers.get(providerId);
    if (!provider) return null;

    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      accessibilityScore: provider.accessibilityScore,
      capabilityCount: provider.capabilities.length,
      active: provider.active,
    };
  }

  /**
   * Generate unique provider ID
   */
  private generateProviderId(): string {
    return `provider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get broker statistics
   */
  getStats() {
    const providers = Array.from(this.providers.values());
    const byType: Record<string, number> = {};
    
    providers.forEach(p => {
      byType[p.type] = (byType[p.type] || 0) + 1;
    });

    return {
      totalProviders: providers.length,
      activeProviders: providers.filter(p => p.active).length,
      averageAccessibilityScore: providers.reduce((sum, p) => sum + p.accessibilityScore, 0) / providers.length,
      providersByType: byType,
    };
  }
}

// Singleton instance
export const apiBroker = new ApiBroker();

// Seed with initial providers
async function seedProviders() {
  await apiBroker.registerProvider({
    name: 'State Vocational Rehabilitation',
    type: 'vocational-rehabilitation',
    description: 'State-funded vocational rehabilitation services for individuals with disabilities, including comprehensive job training and placement assistance.',
    apiEndpoint: '/api/providers/state-vr',
    capabilities: [
      {
        name: 'job-assessment',
        description: 'Comprehensive job skills assessment',
        endpoint: '/assess',
      },
      {
        name: 'training-programs',
        description: 'Access available training programs',
        endpoint: '/training',
      },
      {
        name: 'job-placement',
        description: 'Job placement assistance',
        endpoint: '/placement',
      },
    ],
    accessibilityScore: 85,
    active: true,
  });

  await apiBroker.registerProvider({
    name: 'Deaf Community Education Center',
    type: 'education',
    description: 'Educational resources and programs specifically designed for the deaf community, including ASL courses and accessibility training.',
    apiEndpoint: '/api/providers/dcec',
    capabilities: [
      {
        name: 'asl-classes',
        description: 'Sign language courses',
        endpoint: '/asl',
      },
      {
        name: 'literacy-programs',
        description: 'Literacy and reading programs',
        endpoint: '/literacy',
      },
    ],
    accessibilityScore: 95,
    active: true,
  });

  await apiBroker.registerProvider({
    name: 'Inclusive Employment Network',
    type: 'employment',
    description: 'Job board and employment services focused on connecting deaf individuals with inclusive employers.',
    apiEndpoint: '/api/providers/ien',
    capabilities: [
      {
        name: 'job-search',
        description: 'Search accessible job listings',
        endpoint: '/jobs',
      },
      {
        name: 'employer-outreach',
        description: 'Connect with deaf-friendly employers',
        endpoint: '/employers',
      },
    ],
    accessibilityScore: 90,
    active: true,
  });

  await apiBroker.registerProvider({
    name: 'Accessible Health Services',
    type: 'healthcare',
    description: 'Healthcare provider network with ASL interpreters and accessible communication tools.',
    apiEndpoint: '/api/providers/ahs',
    capabilities: [
      {
        name: 'interpreter-booking',
        description: 'Book ASL interpreters for appointments',
        endpoint: '/interpreters',
      },
      {
        name: 'accessible-clinics',
        description: 'Find accessible healthcare facilities',
        endpoint: '/clinics',
      },
    ],
    accessibilityScore: 80,
    active: true,
  });
}

// Initialize with seed data
seedProviders();

export default apiBroker;
