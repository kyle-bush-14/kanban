import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import type { AppRouter } from "../../server/router";

// Same-origin: Vite proxies /rpc to the API in dev, and the API serves the
// built client in production, so no origin is needed.
const link = new RPCLink({ url: `${window.location.origin}/rpc` });

export const api: RouterClient<AppRouter> = createORPCClient(link);
