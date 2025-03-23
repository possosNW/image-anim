import {
  createRequestHandler,
  type ServerBuild,
} from "@remix-run/cloudflare";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file won’t exist if it hasn’t yet been built
import * as build from "./build/server";
import { getLoadContext } from "./load-context";

const handleRemixRequest = createRequestHandler(build as ServerBuild);

export default {
  async fetch(
    request: Request,
    env: Env, // 👈 this comes from worker-configuration.d.ts
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    try {
      // 🧠 Construct context passed to all loaders/actions
      const loadContext = getLoadContext({
        request,
        context: {
          cloudflare: {
            cf: request.cf,
            env,
            caches,
            ctx: {
              waitUntil: ctx.waitUntil.bind(ctx),
              passThroughOnException: ctx.passThroughOnException.bind(ctx),
            },
          },
        },
      });

      // 🌐 Log incoming request
      console.log(`➡️ ${method} ${url.pathname}`);

      // Handle the request via Remix
      const response = await handleRemixRequest(request, loadContext);

      // ✅ Log response status
      console.log(`⬅️ ${method} ${url.pathname} → ${response.status}`);

      return response;
    } catch (error) {
      // ❌ Error handling and logging
      console.error(`💥 Error handling ${method} ${url.pathname}`, error);

      return new Response("Internal Server Error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      });
    }
  },
} satisfies ExportedHandler<Env>;
