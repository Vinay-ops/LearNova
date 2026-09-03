// Scratch server: serves dist/ like Vercel (SPA fallback) and proxies /api -> localhost:8000
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const DIST = path.resolve("dist");
const PORT = 5198;
const API_TARGET = "http://localhost:8000";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
};

async function serveStatic(reqUrl, res) {
  let rel = decodeURIComponent(new URL(reqUrl, "http://x").pathname);
  if (rel === "/") rel = "/index.html";
  let file = path.join(DIST, rel);
  if (!existsSync(file) || !file.startsWith(DIST)) {
    // SPA fallback
    file = path.join(DIST, "index.html");
  }
  try {
    const buf = await readFile(file);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(file)] || "application/octet-stream",
      "Cache-Control": "no-cache",
    });
    res.end(buf);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
}

const server = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url.startsWith("/api/")) {
    // proxy to backend
    const proxyReq = http.request(
      API_TARGET + url,
      { method: req.method, headers: { ...req.headers, host: "localhost:8000" } },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );
    proxyReq.on("error", (e) => {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("proxy error: " + e.message);
    });
    req.pipe(proxyReq);
    return;
  }
  serveStatic(url, res);
});

server.listen(PORT, () => {
  console.log(`prod-test server on http://localhost:${PORT}`);
});
