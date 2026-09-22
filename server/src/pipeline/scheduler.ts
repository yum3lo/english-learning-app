import cron from 'node-cron';
import { runIngestionPipeline } from './index';

let started = false;

// Runs the ingestion pipeline every 6 hours. Idempotent - safe to call once at startup.
// Off by default (each run costs real Guardian/YouTube/OpenAI API usage) - set
// ENABLE_SCHEDULED_INGESTION=true in the environment to turn it back on.
export function startIngestionScheduler(): void {
  if (started) return;
  started = true;

  if (process.env.ENABLE_SCHEDULED_INGESTION === 'true') {
    cron.schedule('0 */6 * * *', () => {
      runIngestionPipeline().catch(err => console.error('[pipeline] scheduled run failed:', err));
    });
  } else {
    console.log('[pipeline] scheduled ingestion is disabled (set ENABLE_SCHEDULED_INGESTION=true to re-enable)');
  }

  // Off by default: nodemon restarts on every file save in dev would otherwise re-fire real
  // Guardian/OpenAI/Wikipedia calls each time. Set RUN_PIPELINE_ON_BOOT=true to run once
  // immediately on startup (e.g. to backfill an empty DB) - independent of the flag above.
  if (process.env.RUN_PIPELINE_ON_BOOT === 'true') {
    runIngestionPipeline().catch(err => console.error('[pipeline] initial run failed:', err));
  }
}
