"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const client_1 = require("@prisma/client");
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma = new client_1.PrismaClient();
async function authRoutes(fastify) {
    fastify.post('/login', async (request, reply) => {
        try {
            const { emailAddress, password } = request.body;
            if (!emailAddress || !password) {
                return reply.status(400).send({ error: 'Wrong payload' });
            }
            const user = await prisma.user.findUnique({
                where: { email: emailAddress },
            });
            if (!user) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }
            const validPassword = await bcrypt_1.default.compare(password, user.password);
            if (!validPassword) {
                return reply.status(401).send({ error: 'Invalid credentials' });
            }
            const token = fastify.jwt.sign({
                id: user.id,
                email: user.email,
                apiKey: user.apiKey
            });
            return { token };
        }
        catch (error) {
            console.error('Error during login:', error);
            return reply.status(500).send({ error: 'Internal server error' });
        }
    });
    fastify.post('/register', async (request, reply) => {
        const { emailAddress, password } = request.body;
        if (!emailAddress || !password) {
            return reply.status(400).send({ error: 'Wrong payload' });
        }
        const existingUser = await prisma.user.findUnique({
            where: { email: emailAddress },
        });
        if (existingUser) {
            return reply.status(400).send({ error: 'Email already registered' });
        }
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma.user.create({
            data: {
                email: emailAddress,
                password: hashedPassword,
            },
        });
        return { apiKey: user.apiKey };
    });
}
