// apps/workers/src/health.ts
//
// Minimal HTTP health endpoint for k8s / Fly / ECS health checks. We
// do not use a framework — node:http keeps the worker image tiny.
//
// /health → 200 with redis + db ping status.
//
// We don't add /metrics here (Phase 1). When we add Prometheus it'll
// be the same trick: another endpoint on the same server.

import http from 'node:http';
import { getRedis } from '@hiring-os/queue';
import { db } from '@hiring-os/db';

export function startHealthServer(port: number) {
  const server = http.createServer(async (req, res) => {
    if (req.url !== '/health') {
      res.statusCode = 404;
      res.end();
      return;
    }
    const redisOk = await getRedis()
      .ping()
      .then(() => true)
      .catch(() => false);
    const dbOk = await db
      .$queryRaw`SELECT 1`.then(() => true)
      .catch(() => false);
    const ok = redisOk && dbOk;
    res.statusCode = ok ? 200 : 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ ok, redis: redisOk, db: dbOk }));
  });
  server.listen(port, () => {
    console.log(`[workers] health server listening on :${port}`);
  });
  return server;
}
