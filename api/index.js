"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const app_1 = require("./app");
// Handler for Vercel serverless deployment
async function handler(req, reply) {
    const app = await (0, app_1.createApp)();
    app.ready().then(() => {
        app.server.emit('request', req, reply);
    });
}
// Local development server
if (process.env.NODE_ENV !== 'production') {
    const start = async () => {
        const app = await (0, app_1.createApp)();
        try {
            const port = process.env.API_PORT ? parseInt(process.env.API_PORT) : 5001;
            await app.listen({ port, host: '0.0.0.0' });
            console.log(`Server is running on http://localhost:${port}`);
        }
        catch (err) {
            app.log.error(err);
            process.exit(1);
        }
    };
    start();
}
