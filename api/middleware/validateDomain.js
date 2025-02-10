"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateDomain = validateDomain;
async function validateDomain(request, reply) {
    const origin = request.headers.origin;
    const user = request.user;
    console.log('------------------------>', origin);
    if (!origin) {
        return reply.status(400).send({ error: 'Origin header is required' });
    }
    try {
        const domain = new URL(origin).hostname;
        const allowedDomains = await request.server.prisma.allowedDomain.findMany({
            where: {
                userId: user.id,
            },
        });
        const isAllowedDomain = allowedDomains.some(d => domain === d.domain ||
            domain.endsWith('.' + d.domain));
        if (!isAllowedDomain) {
            return reply.status(403).send({
                error: 'Domain not allowed',
                message: 'This domain is not authorized to make API requests'
            });
        }
    }
    catch (error) {
        return reply.status(400).send({ error: 'Invalid origin header' });
    }
}
