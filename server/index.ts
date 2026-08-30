import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { createRequestListener } from "./app.ts";
import { db, pool } from "./db/client.ts";
import { router } from "./router.ts";

const PORT = Number(process.env.PORT ?? 3000);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const server = createServer(createRequestListener(router, join(ROOT, "dist")));

async function main() {
  // Migrate before accepting traffic so the schema is never behind the code.
  await migrate(db, { migrationsFolder: join(ROOT, "drizzle") });

  server.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}/rpc`);
  });
}

async function shutdown(signal: string) {
  console.log(`\n${signal} received, shutting down.`);
  server.close();
  await pool.end();
  process.exit(0);
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

main().catch((error) => {
  console.error("Failed to start:", error);
  process.exit(1);
});
