import type { IncomingMessage, ServerResponse } from 'node:http';
import { executeAdminAiAnalysis } from '../server/aiAnalyzeCore';

const MAX_BODY_BYTES = 2 * 1024 * 1024;

function sendJson(res: ServerResponse, status: number, payload: Record<string, unknown>) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<unknown> {
  if (req.body !== undefined) {
    if (typeof req.body === 'string') {
      return JSON.parse(req.body);
    }
    return req.body;
  }

  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;

    req.on('data', (chunk: Buffer | string) => {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        reject(new Error('PAYLOAD_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(buf);
    });

    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('INVALID_JSON'));
      }
    });

    req.on('error', (err) => reject(err));
  });
}

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Phương thức không được hỗ trợ. Chỉ chấp nhận POST.' });
    return;
  }

  let parsedBody: unknown;
  try {
    parsedBody = await readJsonBody(req);
  } catch (err) {
    const msg = (err as Error)?.message;
    if (msg === 'PAYLOAD_TOO_LARGE') {
      sendJson(res, 413, { error: 'Kích thước dữ liệu vượt quá giới hạn 2MB.' });
      return;
    }
    sendJson(res, 400, { error: 'Dữ liệu JSON gửi lên không hợp lệ.' });
    return;
  }

  const rawAuth = req.headers.authorization;
  const authHeader = Array.isArray(rawAuth) ? rawAuth[0] : rawAuth;

  const result = await executeAdminAiAnalysis(authHeader, parsedBody);
  sendJson(res, result.status, result.body);
}
