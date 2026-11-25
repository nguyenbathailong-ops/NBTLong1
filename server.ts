import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { executeAdminAiAnalysis } from './server/aiAnalyzeCore.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  app.post('/api/ai-analyze', async (req: Request, res: Response) => {
    const result = await executeAdminAiAnalysis(req.headers.authorization, req.body);
    res.status(result.status).json(result.body);
  });

  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'Không tìm thấy API endpoint.' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Express error:', err);
    res.status(500).json({ error: 'Lỗi máy chủ nội bộ.' });
  });

  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`RHINOLOG server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start RHINOLOG server:', err);
  process.exit(1);
});
