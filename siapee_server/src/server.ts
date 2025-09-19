import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

// Log unexpected errors to help diagnose startup/binding/network issues
process.on('unhandledRejection', (reason) => {
  console.error('[siapee_server] UnhandledRejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[siapee_server] UncaughtException:', err);
});

const server = app.listen(env.port, env.host as any, () => {
  console.log(`[siapee_server] listening on http://${env.host}:${env.port}`);
});

server.on('error', (err) => {
  console.error('[siapee_server] Server listen error:', err);
});
