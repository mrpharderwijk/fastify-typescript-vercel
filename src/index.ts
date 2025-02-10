import { createApp } from './app';
import { IncomingMessage, ServerResponse } from 'http';

// Handler for Vercel serverless deployment
export default async function handler(req: IncomingMessage, reply: ServerResponse) {
  const app = await createApp();
  app.ready().then(() => {
    app.server.emit('request', req, reply);
  });
}

// Local development server
if (process.env.NODE_ENV !== 'production') {
  const start = async () => {
    const app = await createApp();
    try {
      const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 5001;
      await app.listen({ port, host: '0.0.0.0' });
      console.log(`Server is running on http://localhost:${port}`);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };
  start();
}