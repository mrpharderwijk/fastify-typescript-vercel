import { prismaMock } from './mocks/prisma.mock';

jest.mock('../src/utils/db', () => ({
  prisma: prismaMock
})); 