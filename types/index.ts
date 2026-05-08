/**
 * Core Type Definitions for PinkSync Platform
 */

// User Types
export interface DeafUser {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  preferences: AccessibilityPreferences;
  deafAuthVerified: boolean;
  mbtqIntegration?: MbtqIntegration;
}

export interface UserProfile {
  displayName: string;
  avatar?: string;
  location?: string;
  deafCommunity?: string[];
  communicationPreferences: CommunicationPreferences;
}

export interface CommunicationPreferences {
  preferredLanguage: string;
  signLanguageDialect?: string;
  textComplexity: 'simple' | 'standard' | 'complex';
  visualAids: boolean;
  captioning: boolean;
}

export interface AccessibilityPreferences {
  simplifyText: boolean;
  visualEnhancements: boolean;
  signLanguage: boolean;
  transcription: boolean;
  colorScheme?: 'light' | 'dark' | 'high-contrast';
  fontSize?: 'small' | 'medium' | 'large' | 'x-large';
  animations?: boolean;
}

// Event System Types
export interface PlatformEvent {
  id: string;
  type: EventType;
  source: EventSource;
  timestamp: Date;
  payload: any;
  userId?: string;
  metadata?: Record<string, any>;
}

export type EventType =
  | 'user.auth'
  | 'user.preference.update'
  | 'content.transform'
  | 'service.request'
  | 'signal.received'
  | 'notification.triggered'
  | 'provider.update'
  | 'community.feedback'
  | 'research.indexed'
  | 'worker.completed';

export type EventSource =
  | 'web'
  | 'extension'
  | 'embedded'
  | 'api'
  | 'worker'
  | 'signal'
  | 'notificator';

// Service Provider Types
export interface ServiceProvider {
  id: string;
  name: string;
  type: ProviderType;
  description: string;
  apiEndpoint: string;
  capabilities: ProviderCapability[];
  accessibilityScore: number;
  active: boolean;
  metadata?: Record<string, any>;
}

export type ProviderType =
  | 'vocational-rehabilitation'
  | 'education'
  | 'employment'
  | 'healthcare'
  | 'community'
  | 'government'
  | 'enterprise'
  | 'other';

export interface ProviderCapability {
  name: string;
  description: string;
  endpoint: string;
  parameters?: Record<string, any>;
}

// Research & RAG Types
export interface ResearchDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  type: ResearchType;
  tags: string[];
  embedding?: number[];
  communityVotes: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ResearchType =
  | 'accessibility-guideline'
  | 'community-feedback'
  | 'usage-pattern'
  | 'best-practice'
  | 'provider-review'
  | 'technical-documentation';

export interface VectorSearchQuery {
  query: string;
  topK?: number;
  filter?: Record<string, any>;
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  document: ResearchDocument;
  score: number;
  metadata?: Record<string, any>;
}

// Worker Types
export interface BackgroundJob {
  id: string;
  type: JobType;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: JobStatus;
  payload: any;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
  maxRetries: number;
}

export type JobType =
  | 'content.simplify'
  | 'content.translate'
  | 'provider.sync'
  | 'research.index'
  | 'user.match'
  | 'notification.send'
  | 'analytics.process';

export type JobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

// PinkFlow Types
export interface ContentTransformation {
  id: string;
  originalContent: string;
  transformedContent: string;
  transformationType: TransformationType;
  userId?: string;
  metadata: TransformationMetadata;
  createdAt: Date;
}

export type TransformationType =
  | 'simplify'
  | 'visualize'
  | 'transcribe'
  | 'sign-language'
  | 'structure';

export interface TransformationMetadata {
  complexity: number;
  readabilityScore: number;
  confidence: number;
  processingTime: number;
  engine: string;
}

// Signal & Notification Types
export interface Signal {
  id: string;
  type: SignalType;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  source: string;
  target: string[];
  payload: any;
  deliveredAt?: Date;
  acknowledgedAt?: Date;
}

export type SignalType =
  | 'system.alert'
  | 'user.message'
  | 'service.update'
  | 'content.available'
  | 'provider.notification';

export interface NotificationConfig {
  enabled: boolean;
  visual: boolean;
  vibration: boolean;
  sound: boolean;
  customStyles?: Record<string, any>;
}

// MBTQ Integration Types
export interface MbtqIntegration {
  enabled: boolean;
  userId: string;
  syncEnabled: boolean;
  sharedPreferences: boolean;
  lastSync?: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: Date;
    requestId: string;
    version: string;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Configuration Types
export interface EnvironmentConfig {
  environment: string;
  apiUrl: string;
  features: Record<string, boolean>;
  debug: boolean;
}

// ==========================================
// Auth Service Event Types (DeafAuth + PinkSync)
// ==========================================

export type AuthEventType =
  | 'AUTH_INITIATED'
  | 'AUTH_COMPLETED'
  | 'AUTH_FAILED'
  | 'TOKEN_REFRESHED'
  | 'TOKEN_REVOKED'
  | 'USER_PREFERENCES_UPDATED'
  | 'ACCOMMODATION_REQUESTED'
  | 'ACCOMMODATION_FULFILLED'
  | 'SESSION_HANDSHAKE'
  | 'PROTOCOL_SYNC';

export interface BaseEvent {
  id: string;
  type: AuthEventType;
  timestamp: Date;
  source: 'deafauth' | 'pinksync';
  userId: string;
  data: unknown;
}

export interface AuthEvent extends BaseEvent {
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface EventHandler {
  handle(event: AuthEvent): Promise<void>;
}

export interface EventPublisher {
  publish(event: AuthEvent): Promise<void>;
}

export interface EventSubscriber {
  subscribe(eventType: AuthEventType, handler: EventHandler): void;
  unsubscribe(eventType: AuthEventType, handler: EventHandler): void;
}

// ==========================================
// Gemini Service Types
// ==========================================

export interface HeatmapAnalysisResult {
  summary: string;
  keyFactors: string[];
  recommendations: string[];
}

export interface Task {
  id: string;
  name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  priority: number;
  deadline?: Date;
}

export interface Event {
  category: string;
  name: string;
  date: string;
  location: string;
  description: string;
  isGlobal?: boolean;
}

export interface MarketingContentSuggestion {
  content: string;
  accessibilityTip: string;
}

export interface TrainingScenario {
  scenario: string;
  choices: string[];
  correctAnswer?: number;
  explanation?: string;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface MediaAnalysisResult {
  analysis: string;
  accessibilityScore: number;
  criticalIssues: string[];
}

export interface PinkSyncSession {
  session_id: string;
  status: string;
  user_id: string;
  location_id: string;
  mode: string;
  accommodation: {
    type: string;
    provider?: string;
    estimated_start_seconds?: number;
  };
  endpoints: {
    user_url: string;
    staff_url: string;
    captions_url?: string;
  };
}

export interface AccommodationMatch {
  provider: string;
  confidence: number;
  accommodationType: string;
  estimatedWaitTime?: number;
  alternatives?: string[];
}

export interface PartnerProvider {
  id: string;
  name: string;
  capabilities: string[];
  region: string;
  active: boolean;
}

// ==========================================
// FastAPI Backend Bridge Types
// ==========================================

export interface FastAPIConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
}

export interface FastAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    timestamp: string;
    request_id: string;
    processing_time_ms: number;
  };
}

export interface ProtocolSyncRequest {
  user_id: string;
  session_id: string;
  accommodation_type: string;
  preferences: AccessibilityPreferences;
  context?: Record<string, unknown>;
}

export interface ProtocolSyncResponse {
  sync_status: 'success' | 'partial' | 'failed';
  matched_providers: PartnerProvider[];
  session_token: string;
  expires_at: string;
}
