import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

/**
 * Minimal static handler for the built client. Hand-rolled because we're running
 * bare node:http with no framework.
 *
 * Returns true when it served something.
 */
export async function serveStatic(req: IncomingMessage, res: ServerResponse, root: string): Promise<boolean> {
  if (req.method !== "GET" && req.method !== "HEAD") return false;

  const url = new URL(req.url ?? "/", "http://localhost");
  // normalize() collapses any ../ before we join, so a crafted path can't escape root.
  const requested = normalize(decodeURIComponent(url.pathname));
  let filePath = resolve(join(root, requested));

  if (!filePath.startsWith(resolve(root))) {
    res.statusCode = 403;
    res.end("Forbidden");
    return true;
  }

  let info = await stat(filePath).catch(() => null);

  // Directory, or an unknown path: fall back to index.html so the SPA boots.
  if (!info || info.isDirectory()) {
    filePath = join(root, "index.html");
    info = await stat(filePath).catch(() => null);
    if (!info) return false;
  }

  const type = MIME[extname(filePath)] ?? "application/octet-stream";
  res.statusCode = 200;
  res.setHeader("Content-Type", type);
  res.setHeader("Content-Length", info.size);

  // Hashed asset filenames are safe to cache hard; index.html must not be.
  const immutable = filePath.includes("/assets/");
  res.setHeader("Cache-Control", immutable ? "public, max-age=31536000, immutable" : "no-cache");

  if (req.method === "HEAD") {
    res.end();
    return true;
  }

  createReadStream(filePath).pipe(res);
  return true;
}
