import { readFile } from "node:fs/promises";
import path from "node:path";
import type { ServerResponse } from "node:http";

export function createStaticFileSender(frontendRootDir: string) {
  return async function serveStatic(res: ServerResponse, fileName: string, contentType: string): Promise<void> {
    const data = await readFile(path.join(frontendRootDir, fileName), "utf-8");
    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.end(data);
  };
}
