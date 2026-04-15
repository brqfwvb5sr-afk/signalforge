import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(".");
const port = Number(process.env.PORT || 8080);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function resolveRequestPath(url) {
  const pathname = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const cleanPath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  const filePath = resolve(join(root, cleanPath === "/" ? "index.html" : cleanPath));
  if (!filePath.startsWith(root)) {
    return null;
  }
  try {
    if (statSync(filePath).isDirectory()) {
      return join(filePath, "index.html");
    }
  } catch {
    return filePath;
  }
  return filePath;
}

createServer(async (request, response) => {
  const filePath = resolveRequestPath(request.url || "/");
  if (!filePath) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    response.writeHead(200, {
      "content-type": contentTypes[extname(filePath)] || "application/octet-stream"
    });
    response.end(body);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`LexiCore running at http://127.0.0.1:${port}`);
});
