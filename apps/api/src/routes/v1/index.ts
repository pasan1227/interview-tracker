// apps/api/src/routes/v1/index.ts
//
// /v1 mount. Add a new resource by importing its sub-router and
// `app.route()` ing it here.

import { Hono } from 'hono';
import jobs from './jobs';
import candidates from './candidates';
import applications from './applications';
import interviews from './interviews';
import feedbacks from './feedbacks';

const v1 = new Hono();

v1.get('/', (c) =>
  c.json({
    name: 'Hiring OS API',
    version: 'v1',
    resources: [
      '/v1/jobs',
      '/v1/candidates',
      '/v1/applications',
      '/v1/interviews',
      '/v1/feedbacks',
    ],
  })
);

v1.route('/jobs', jobs);
v1.route('/candidates', candidates);
v1.route('/applications', applications);
v1.route('/interviews', interviews);
v1.route('/feedbacks', feedbacks);

export default v1;
