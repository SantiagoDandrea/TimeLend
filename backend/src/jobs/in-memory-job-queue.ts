/**
 * This file implements a small in-memory background job queue.
 * It exists to keep AI verification and appeal resolution off the synchronous HTTP request path.
 * It fits the system by giving the backend a simple asynchronous processing model without introducing external infrastructure.
 */
import type pino from "pino";

export class InMemoryJobQueue<TJob> {
  private activeWorkers = 0;
  private readonly queue: TJob[] = [];

  /**
   * This constructor wires the queue with its logger, processor and concurrency level.
   * It receives the shared logger, a job processor callback and the allowed worker count.
   * It returns an InMemoryJobQueue instance.
   * It is important because the backend needs a small but explicit async processing primitive.
   */
  constructor(
    private readonly logger: pino.Logger,
    private readonly processor: (job: TJob) => Promise<void>,
    private readonly concurrency = 1
  ) {}

  /**
   * This function enqueues a new background job for asynchronous processing.
   * It receives the job payload to enqueue.
   * It returns nothing because the queue processes jobs internally.
   * It is important because HTTP requests should be able to trigger verification work without blocking.
   */
  enqueue(job: TJob) {
    this.queue.push(job);
    this.drainQueue();
  }

  /**
   * This function starts processing queued jobs while respecting the configured concurrency.
   * It receives no parameters because it operates on the internal queue state.
   * It returns nothing because jobs continue asynchronously.
   * It is important because the queue should not require an external scheduler to make progress.
   */
  private drainQueue() {
    while (this.activeWorkers < this.concurrency && this.queue.length > 0) {
      const nextJob = this.queue.shift();

      if (nextJob === undefined) {
        return;
      }

      this.activeWorkers += 1;
      setImmediate(() => {
        void this.runJob(nextJob);
      });
    }
  }

  /**
   * This function executes a single queued job and then continues draining the queue.
   * It receives the job payload selected for processing.
   * It returns a promise that resolves when the job completes.
   * It is important because errors in background work should be logged without stopping the queue entirely.
   */
  private async runJob(job: TJob) {
    try {
      await this.processor(job);
    } catch (error) {
      this.logger.error({ error, job }, "Background job failed");
    } finally {
      this.activeWorkers -= 1;
      this.drainQueue();
    }
  }
}
