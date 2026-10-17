/**
 * Event bus for loose coupling between systems
 */

type Listener<T> = (data: T) => void;

interface EventSubscription<T> {
  listener: Listener<T>;
  once: boolean;
}

/**
 * Event bus - publish/subscribe system
 */
export class EventBus<TEventMap extends Record<string, unknown>> {
  private listeners = new Map<keyof TEventMap, Set<EventSubscription<unknown>>>();

  /**
   * Subscribe to an event
   */
  on<K extends keyof TEventMap>(
    event: K,
    listener: Listener<TEventMap[K]>
  ): () => void {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }

    const subscription: EventSubscription<TEventMap[K]> = {
      listener: listener as Listener<unknown>,
      once: false,
    };

    listeners.add(subscription);

    // Return unsubscribe function
    return () => {
      listeners.delete(subscription);
      if (listeners.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once<K extends keyof TEventMap>(
    event: K,
    listener: Listener<TEventMap[K]>
  ): void {
    let listeners = this.listeners.get(event);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(event, listeners);
    }

    const subscription: EventSubscription<TEventMap[K]> = {
      listener: listener as Listener<unknown>,
      once: true,
    };

    listeners.add(subscription);
  }

  /**
   * Emit an event
   */
  emit<K extends keyof TEventMap>(event: K, data: TEventMap[K]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;

    const toRemove: EventSubscription<unknown>[] = [];

    for (const subscription of listeners) {
      (subscription.listener as Listener<TEventMap[K]>)(data);

      if (subscription.once) {
        toRemove.push(subscription);
      }
    }

    for (const subscription of toRemove) {
      listeners.delete(subscription);
    }

    if (listeners.size === 0) {
      this.listeners.delete(event);
    }
  }

  /**
   * Remove all listeners for an event
   */
  off<K extends keyof TEventMap>(event: K): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners
   */
  clear(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event
   */
  listenerCount<K extends keyof TEventMap>(event: K): number {
    const listeners = this.listeners.get(event);
    return listeners ? listeners.size : 0;
  }
}
