import { createApp } from './app';
import { IncomingMessage, ServerResponse } from 'http';

export default async function handler(req: IncomingMessage, reply: ServerResponse) {
  const app = await createApp();
  app.ready().then(() => {
    app.server.emit('request', req, reply);
  });
}