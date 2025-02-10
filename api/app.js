"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const fastify_1 = __importDefault(require("fastify"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cors_1 = __importDefault(require("@fastify/cors"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
const auth_1 = require("./routes/v1/auth");
const address_1 = require("./routes/v1/lookup/address");
const postal_code_1 = require("./routes/v1/lookup/postal-code");
const domains_1 = require("./routes/v1/auth/domains");
const config_1 = require("./constants/config");
const db_1 = require("./utils/db");
const createApp = async () => {
    const app = (0, fastify_1.default)({
        logger: true,
    });
    // Add Prisma to Fastify instance
    app.decorate('prisma', db_1.prisma);
    // Register plugins
    await app.register(cors_1.default, {
        origin: (origin, cb) => {
            if (!origin) {
                // Allow requests with no origin (like mobile apps or curl requests)
                cb(null, true);
                return;
            }
            try {
                const domain = new URL(origin).hostname;
                // Since we can't access request headers in the CORS callback,
                // we'll do the domain validation in the route handlers
                cb(null, true);
            }
            catch (err) {
                cb(new Error('Invalid origin'), false);
            }
        },
        credentials: true,
    });
    await app.register(jwt_1.default, {
        secret: process.env.JWT_SECRET || 'your-secret-key',
    });
    // Register rate limit plugin with dynamic limits based on subscription
    await app.register(rate_limit_1.default, {
        global: false, // Disable global rate limiting
        max: 1, // Default max (will be overridden)
        timeWindow: 1000, // 1 second
        keyGenerator: (req) => {
            return req.headers['x-api-key'] || '';
        },
        hook: 'preHandler',
        enableDraftSpec: true, // Enable draft spec headers
        addHeadersOnExceeding: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true
        },
        addHeaders: {
            'x-ratelimit-limit': true,
            'x-ratelimit-remaining': true,
            'x-ratelimit-reset': true,
            'retry-after': true
        }
    });
    // Root route
    app.get('/', async () => {
        return {
            status: 'ok',
            message: 'Fastify API is running',
            version: '1.0.0',
            endpoints: {
                auth: {
                    register: '/api/v1/auth/register',
                    login: '/api/v1/auth/login',
                    domains: '/api/v1/auth/domains'
                },
                lookup: {
                    address: '/api/v1/lookup/address',
                    postalCode: '/api/v1/lookup/postal-code'
                }
            }
        };
    });
    // Configure rate limits for protected routes
    const setRateLimits = (routeOptions) => ({
        ...routeOptions,
        config: {
            ...routeOptions.config,
            rateLimit: {
                max: async (req, key) => {
                    if (!key)
                        return 0;
                    const user = await app.prisma.user.findUnique({
                        where: { apiKey: key },
                    });
                    if (!user)
                        return 0;
                    return config_1.RATE_LIMITS_PER_SECOND[user.subscriptionPlan] || 0;
                },
                timeWindow: 1000, // 1 second window
                errorResponseBuilder: (req, context) => ({
                    statusCode: 429,
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Your plan (${req.user?.subscriptionPlan || 'UNKNOWN'}) allows ${context.max} requests per second.`,
                    limit: context.max,
                    remaining: context.remaining,
                    reset: context.reset
                })
            },
        },
    });
    // Register routes with rate limiting
    app.register(auth_1.authRoutes, { prefix: '/api/v1/auth' });
    app.register(domains_1.domainRoutes, { prefix: '/api/v1/auth/domains' });
    app.register(address_1.addressRoutes, { prefix: '/api/v1/lookup/address', routeConfig: setRateLimits });
    app.register(postal_code_1.postalCodeRoutes, { prefix: '/api/v1/lookup/postal-code', routeConfig: setRateLimits });
    return app;
};
exports.createApp = createApp;
