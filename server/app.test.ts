import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, describe, it } from "node:test";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { os } from "@orpc/server";
import * as z from "zod";
import { createRequestListener } from "./app.ts";

/** A stand-in router: this exercises the plumbing, not the database. */
const testRouter = {
  echo: os.input(z.object({ value: z.string() })).handler(({ input }) => ({ echoed: input.value })),
};

let server: Server;
let origin: string;
let dist: string;
let client: RouterClient<typeof testRouter>;

before(async () => {
  dist = await mkdtemp(join(tmpdir(), "kanban-dist-"));
  await writeFile(join(dist, "index.html"), "<!doctype html><title>app shell</title>");
  await writeFile(join(dist, "secret-sibling.txt"), "should never be reachable");

  server = createServer(createRequestListener(testRouter, dist));
  await new Promise<void>((resolve) => server.listen(0, resolve));

  const address = server.address();
  if (address === null || typeof address === "string") throw new Error("expected a TCP address");
  origin = `http://127.0.0.1:${address.port}`;

  client = createORPCClient(new RPCLink({ url: `${origin}/rpc` }));
});

after(() => {
  server.close();
});

describe("request listener", () => {
  it("routes /rpc through oRPC and round-trips a typed call", async () => {
    const result = await client.echo({ value: "hello" });
    assert.deepEqual(result, { echoed: "hello" });
  });

  it("reports validation failures rather than crashing", async () => {
    // @ts-expect-error deliberately violating the input schema
    await assert.rejects(() => client.echo({ value: 42 }));
  });

  it("serves a real file from dist", async () => {
    const response = await fetch(`${origin}/index.html`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") ?? "", /text\/html/);
    assert.match(await response.text(), /app shell/);
  });

  it("falls back to the SPA shell for unknown paths", async () => {
    const response = await fetch(`${origin}/some/client/route`);
    assert.equal(response.status, 200);
    assert.match(await response.text(), /app shell/);
  });

  it("does not let a traversal path escape the dist directory", async () => {
    // Encoded so it survives to the handler instead of being normalised away by fetch.
    const response = await fetch(`${origin}/..%2F..%2Fpackage.json`);
    const body = await response.text();
    assert.ok(!body.includes('"name": "kanban"'), "must not serve files from outside dist");
  });

  it("does not serve the app shell with a long-lived cache header", async () => {
    const response = await fetch(`${origin}/index.html`);
    assert.equal(response.headers.get("cache-control"), "no-cache");
  });
});
