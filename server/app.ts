import type { IncomingMessage, ServerResponse } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import type { AnyRouter } from "@orpc/server";
import { serveStatic } from "./static.ts";

/**
 * Builds the request listener: oRPC under /rpc, the built client everywhere
 * else. Split from index.ts so the routing and static handling can be tested
 * without a database.
 */
export function createRequestListener(
  router: AnyRouter,
  distDir: string,
): (req: IncomingMessage, res: ServerResponse) => void {
  const handler = new RPCHandler(router);

  return (req, res) => {
    void (async () => {
      try {
        const { matched } = await handler.handle(req, res, { prefix: "/rpc" });
        if (matched) return;

        // In dev, Vite serves the client and proxies /rpc here, so this only
        // matters for `npm start` against a built dist/.
        if (await serveStatic(req, res, distDir)) return;

        res.statusCode = 404;
        res.end("Not found");
      } catch (error) {
        console.error("Unhandled request error:", error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end("Internal server error");
        }
      }
    })();
  };
}
