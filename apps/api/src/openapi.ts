// apps/api/src/openapi.ts
//
// Phase 1 hand-written OpenAPI snippet. Phase 6 swaps in
// @hono/zod-openapi auto-generation once the API surface stabilises.
// Today the spec lives here as a static JSON object so customer
// integrations have something to point Postman / Insomnia at.

export const openapiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'Hiring OS API',
    version: '0.1.0',
    description:
      'Phase 1 read-only API. Authenticate with a Personal Access Token via Bearer header.',
  },
  servers: [{ url: process.env.PUBLIC_API_BASE_URL ?? 'http://localhost:4001' }],
  security: [{ bearerAuth: [] }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'PAT',
      },
    },
  },
  paths: {
    '/v1/jobs': { get: { summary: 'List jobs (positions)', responses: { '200': { description: 'OK' } } } },
    '/v1/candidates': { get: { summary: 'List candidates', responses: { '200': { description: 'OK' } } } },
    '/v1/candidates/{id}': { get: { summary: 'Get one candidate', responses: { '200': { description: 'OK' } } } },
    '/v1/applications': { get: { summary: 'List applications (synthetic in Phase 1)', responses: { '200': { description: 'OK' } } } },
    '/v1/interviews': { get: { summary: 'List interviews', responses: { '200': { description: 'OK' } } } },
    '/v1/feedbacks': { get: { summary: 'List feedbacks', responses: { '200': { description: 'OK' } } } },
  },
};
