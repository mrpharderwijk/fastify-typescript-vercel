import { FastifyInstance } from 'fastify';
import { createApp } from '../../src/app';
import { prismaMock } from '../mocks/prisma.mock';
import { test, expect, describe, beforeAll, afterAll } from '@jest/globals';
import supertest from 'supertest';
import { SubscriptionPlan, Prisma, User, ApiUsage } from '@prisma/client';

describe('Address Lookup API', () => {
  let app: FastifyInstance;
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    apiKey: 'test-api-key-123',
    subscriptionPlan: SubscriptionPlan.HOBBY,
    monthlyRequests: 0,
    lastRequestReset: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  } satisfies Omit<User, 'ApiUsage'>;

  const mockAddress = {
    id: 1,
    streetName: 'Test Street',
    houseNumber: '42',
    postalCode: '1234AB',
    city: 'Amsterdam',
    municipality: 'Amsterdam',
    province: 'Noord-Holland',
    neighborhood: 'Test Neighborhood',
    district: 'Test District',
    latitude: 52.3676,
    longitude: 4.9041,
    createdAt: new Date()
  };

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/address/lookup', () => {
    test('should return address when valid postal code and house number are provided', async () => {
      // Mock the Prisma calls
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);
      prismaMock.user.update.mockResolvedValue(mockUser);
      prismaMock.apiUsage.create.mockResolvedValue({
        id: '1',
        userId: mockUser.id,
        endpoint: '/api/v1/address/lookup',
        timestamp: new Date()
      } as ApiUsage);

      const response = await supertest(app.server)
        .post('/api/v1/address/lookup')
        .set('x-api-key', mockUser.apiKey)
        .send({
          postalCode: mockAddress.postalCode,
          houseNumber: mockAddress.houseNumber,
        });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        streetName: mockAddress.streetName,
        houseNumber: mockAddress.houseNumber,
        postalCode: mockAddress.postalCode,
        city: mockAddress.city,
      });
    });

    test('should return 404 when address is not found', async () => {
      // Mock the Prisma calls
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.address.findFirst.mockResolvedValue(null);
      prismaMock.user.update.mockResolvedValue(mockUser);
      prismaMock.apiUsage.create.mockResolvedValue({
        id: '2',
        userId: mockUser.id,
        endpoint: '/api/v1/address/lookup',
        timestamp: new Date()
      } as ApiUsage);

      const response = await supertest(app.server)
        .post('/api/v1/address/lookup')
        .set('x-api-key', mockUser.apiKey)
        .send({
          postalCode: '9999ZZ',
          houseNumber: '999',
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Address not found');
    });

    test('should return 401 when API key is missing', async () => {
      const response = await supertest(app.server)
        .post('/api/v1/address/lookup')
        .send({
          postalCode: mockAddress.postalCode,
          houseNumber: mockAddress.houseNumber,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'API key is required');
    });

    test('should return 401 when API key is invalid', async () => {
      // Mock the Prisma call to return null for invalid API key
      prismaMock.user.findUnique.mockResolvedValue(null);

      const response = await supertest(app.server)
        .post('/api/v1/address/lookup')
        .set('x-api-key', 'invalid-api-key')
        .send({
          postalCode: mockAddress.postalCode,
          houseNumber: mockAddress.houseNumber,
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid API key');
    });

    test('should return 400 when required fields are missing', async () => {
      // Mock the Prisma calls
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const response = await supertest(app.server)
        .post('/api/v1/address/lookup')
        .set('x-api-key', mockUser.apiKey)
        .send({
          postalCode: mockAddress.postalCode,
          // missing houseNumber
        });

      expect(response.status).toBe(400);
    });

    test('should respect rate limits', async () => {
      // Mock the Prisma calls
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.address.findFirst.mockResolvedValue(mockAddress);
      prismaMock.user.update.mockResolvedValue(mockUser);
      prismaMock.apiUsage.create.mockResolvedValue({
        id: '3',
        userId: mockUser.id,
        endpoint: '/api/v1/address/lookup',
        timestamp: new Date()
      } as ApiUsage);

      // Make 6 requests (HOBBY plan limit is 5 per second)
      const requests = Array(6).fill(null).map(() =>
        supertest(app.server)
          .post('/api/v1/address/lookup')
          .set('x-api-key', mockUser.apiKey)
          .send({
            postalCode: mockAddress.postalCode,
            houseNumber: mockAddress.houseNumber,
          })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponse = responses[responses.length - 1];

      expect(rateLimitedResponse.status).toBe(429);
      expect(rateLimitedResponse.body).toHaveProperty('error', 'Too Many Requests');
    });
  });
}); 