"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postalCodeRoutes = postalCodeRoutes;
const client_1 = require("@prisma/client");
const auth_1 = require("../../../../middleware/auth");
const validateDomain_1 = require("../../../../middleware/validateDomain");
const prisma = new client_1.PrismaClient();
async function postalCodeRoutes(fastify) {
    fastify.post('/', {
        preHandler: [auth_1.validateApiKey, validateDomain_1.validateDomain],
    }, async (request, reply) => {
        const { streetName, houseNumber, city } = request.body;
        const address = await prisma.address.findFirst({
            where: {
                streetName,
                houseNumber,
                city,
            },
        });
        if (!address) {
            return reply.status(404).send({ error: 'Address not found' });
        }
        return address;
    });
}
