"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.domainRoutes = domainRoutes;
const auth_1 = require("../../../middleware/auth");
async function domainRoutes(fastify) {
    // Get all allowed domains for the user
    fastify.get('/', {
        preHandler: auth_1.validateApiKey,
    }, async (request) => {
        const user = request.user;
        const domains = await fastify.prisma.allowedDomain.findMany({
            where: {
                userId: user.id,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return domains;
    });
    // Add a new allowed domain
    fastify.post('/', {
        preHandler: auth_1.validateApiKey,
    }, async (request, reply) => {
        const user = request.user;
        const { domain } = request.body;
        if (!domain) {
            return reply.status(400).send({ error: 'Domain is required' });
        }
        // Validate domain format
        try {
            new URL(`https://${domain}`);
        }
        catch (error) {
            return reply.status(400).send({ error: 'Invalid domain format' });
        }
        try {
            const newDomain = await fastify.prisma.allowedDomain.create({
                data: {
                    domain: domain.toLowerCase(),
                    userId: user.id,
                },
            });
            return newDomain;
        }
        catch (error) {
            // Handle unique constraint violation
            if (error.code === 'P2002') {
                return reply.status(400).send({ error: 'Domain already exists for this user' });
            }
            throw error;
        }
    });
    // Delete an allowed domain
    fastify.delete('/:domainId', {
        preHandler: auth_1.validateApiKey,
    }, async (request, reply) => {
        const user = request.user;
        const { domainId } = request.params;
        const domain = await fastify.prisma.allowedDomain.findFirst({
            where: {
                id: domainId,
                userId: user.id,
            },
        });
        if (!domain) {
            return reply.status(404).send({ error: 'Domain not found' });
        }
        await fastify.prisma.allowedDomain.delete({
            where: {
                id: domainId,
            },
        });
        return { success: true };
    });
}
