import { EventEmitter } from 'events';

export class InMemoryQueue<T = any> extends EventEmitter {
  private queue: T[] = [];
  private isProcessing = false;
  private consumer?: (data: T) => Promise<void>;

  constructor() {
    super();
  }

  enqueue(data: T): void {
    this.queue.push(data);
    this.emit('enqueued');
    this.processNext();
  }

  setConsumer(consumer: (data: T) => Promise<void>): void {
    this.consumer = consumer;
    this.processNext();
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0 || !this.consumer) {
      return;
    }

    this.isProcessing = true;
    const data = this.queue.shift();

    if (data !== undefined) {
      try {
        await this.consumer(data);
      } catch (err) {
        console.error('Error processing queue job:', err);
      }
    }

    this.isProcessing = false;
    
    // Process next item immediately if available
    if (this.queue.length > 0) {
      this.processNext();
    }
  }

  get length(): number {
    return this.queue.length;
  }
}

// Global instance for turn processing
export const turnQueue = new InMemoryQueue<string>();
