import type { IncomingMessage, ServerResponse } from "node:http";

export function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Некорректный JSON в теле запроса");
  }
}
