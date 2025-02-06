# Vercel Fastify API

A TypeScript-based Fastify API with authentication and address lookup functionality, deployed on Vercel.

## Features

- User authentication (login/register)
- API key generation and validation
- Address lookup by postal code and house number
- Rate limiting based on subscription plans
- Request logging
- PostgreSQL database with Prisma ORM

## Environment Variables

The following environment variables need to be set in your Vercel project:

```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Run database migrations:

```bash
npm run prisma:migrate
```

4. Start development server:

```bash
npm run dev
```

## Deployment

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Deploy to Vercel:

```bash
vercel
```

3. Set environment variables in Vercel:

```bash
vercel env add DATABASE_URL
vercel env add JWT_SECRET
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register`

  - Register a new user
  - Body: `{ "emailAddress": "user@example.com", "password": "password123" }`
  - Response: `{ "apiKey": "generated-api-key" }`

- `POST /api/v1/auth/login`
  - Login with credentials
  - Body: `{ "emailAddress": "user@example.com", "password": "password123" }`
  - Response: `{ "token": "jwt-token" }`

### Address Lookup

- `POST /api/v1/address/lookup`

  - Look up address by postal code and house number
  - Headers: `{ "x-api-key": "your-api-key" }`
  - Body: `{ "postalCode": "1234AB", "houseNumber": "42" }`

- `POST /api/v1/postal-code/lookup`
  - Look up postal code by street name, house number, and city
  - Headers: `{ "x-api-key": "your-api-key" }`
  - Body: `{ "streetName": "Example Street", "houseNumber": "42", "city": "Amsterdam" }`

## Rate Limits

- HOBBY: 1,000 requests/month
- PRO: 10,000 requests/month
- ENTERPRISE: 100,000 requests/month
