/**
 * PinkSync Event Bus
 * 
 * In-memory event bus for pub/sub communication between DeafAuth and PinkSync.
 * Can be extended to use external message brokers like Google Pub/Sub, RabbitMQ, etc.
 */

import { 
  AuthEvent, 
  AuthEventType, 
  EventHandler, 
  EventPublisher, 
  EventSubscriber 
} from '@/types/index';

export class EventBus implements EventPublisher, EventSubscriber {
  private handlers: Map<AuthEventType, Set<EventHandler>>;
  private eventLog: AuthEvent[];
  private readonly maxLogSize: number = 1000;

  constructor() {
    this.handlers = new Map();
    this.eventLog = [];
  }

  /**
   * Publish an event to all registered handlers
   */
  async publish(event: AuthEvent): Promise<void> {
    console.log(`[EventBus] Publishing event: ${event.type} from ${event.source}`);
    
    // Log the event
    this.logEvent(event);
    
    // Get handlers for this event type
    const eventHandlers = this.handlers.get(event.type);
    
    if (!eventHandlers || eventHandlers.size === 0) {
      console.log(`[EventBus] No handlers registered for event type: ${event.type}`);
      return;
    }

    // Execute all handlers in parallel
    const handlerPromises = Array.from(eventHandlers).map(handler => 
      this.executeHandler(handler, event)
    );

    await Promise.all(handlerPromises);
  }

  /**
   * Subscribe a handler to an event type
   */
  subscribe(eventType: AuthEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    
    this.handlers.get(eventType)!.add(handler);
    console.log(`[EventBus] Handler subscribed to event type: ${eventType}`);
  }

  /**
   * Unsubscribe a handler from an event type
   */
  unsubscribe(eventType: AuthEventType, handler: EventHandler): void {
    const eventHandlers = this.handlers.get(eventType);
    if (eventHandlers) {
      eventHandlers.delete(handler);
      console.log(`[EventBus] Handler unsubscribed from event type: ${eventType}`);
    }
  }

  /**
   * Execute a handler with error handling
   */
  private async executeHandler(handler: EventHandler, event: AuthEvent): Promise<void> {
    try {
      await handler.handle(event);
    } catch (error) {
      console.error(`[EventBus] Error executing handler for event ${event.type}:`, error);
      // Continue processing other handlers even if one fails
    }
  }

  /**
   * Log event for debugging and auditing
   */
  private logEvent(event: AuthEvent): void {
    this.eventLog.push(event);
    
    // Trim log if it exceeds max size
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog = this.eventLog.slice(-this.maxLogSize);
    }
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(limit: number = 10): AuthEvent[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Get all events of a specific type
   */
  getEventsByType(type: AuthEventType): AuthEvent[] {
    return this.eventLog.filter(e => e.type === type);
  }

  /**
   * Get events for a specific user
   */
  getEventsByUser(userId: string): AuthEvent[] {
    return this.eventLog.filter(e => e.userId === userId);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  /**
   * Get statistics about the event bus
   */
  getStats() {
    return {
      handlerCount: Array.from(this.handlers.values()).reduce((sum, set) => sum + set.size, 0),
      eventTypes: Array.from(this.handlers.keys()),
      logSize: this.eventLog.length,
      maxLogSize: this.maxLogSize,
    };
  }
}

/**
 * Singleton instance of the event bus
 */
export const eventBus = new EventBus();

/**
 * Helper function to create an event with common fields
 */
export function createEvent<T extends AuthEvent>(
  type: AuthEventType,
  source: 'deafauth' | 'pinksync',
  userId: string,
  data: unknown
): T {
  return {
    id: generateEventId(),
    type,
    timestamp: new Date(),
    source,
    userId,
    data,
  } as T;
}

/**
 * Generate a unique event ID
 */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Decorator for creating event handlers
 */
export function EventHandlerDecorator(eventType: AuthEventType) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: unknown[]) {
      console.log(`[EventHandler] Processing ${eventType}`);
      return await originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}

export default eventBus;
