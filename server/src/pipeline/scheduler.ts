import cron from 'node-cron';
import { runIngestionPipeline } from './index';

let started = false;

// Runs the ingestion pipeline every 6 hours. Idempotent - safe to call once at startup.
export function startIngestionScheduler(): void {
  if (started) return;
  started = true;

  cron.schedule('0 */6 * * *', () => {
    runIngestionPipeline().catch(err => console.error('[pipeline] scheduled run failed:', err));
  });

  // Off by default: nodemon restarts on every file save in dev would otherwise re-fire real
  // Guardian/OpenAI/Wikipedia calls each time. Set RUN_PIPELINE_ON_BOOT=true once deployed so
  // the DB isn't empty while waiting for the first scheduled tick.
  if (process.env.RUN_PIPELINE_ON_BOOT === 'true') {
    runIngestionPipeline().catch(err => console.error('[pipeline] initial run failed:', err));
  }
}
