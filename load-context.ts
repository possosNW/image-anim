import { type PlatformProxy } from "wrangler";

type GetLoadContextArgs = {
  request: Request;
  context: {
    cloudflare: Omit<PlatformProxy<Env>, "dispose" | "caches" | "cf"> & {
      caches: PlatformProxy<Env>["caches"] | CacheStorage;
      cf: Request["cf"];
      ctx: ExecutionContext;
    };
  };
};

// 👇 This merges into Remix's AppLoadContext globally
declare module "@remix-run/cloudflare" {
  interface AppLoadContext extends ReturnType<typeof getLoadContext> {}
}

// ✅ This is what you can use in loaders/actions
export function getLoadContext({ context }: GetLoadContextArgs) {
  return {
    env: context.cloudflare.env,
    cf: context.cloudflare.cf,
    caches: context.cloudflare.caches,
    waitUntil: context.cloudflare.ctx.waitUntil,
    passThroughOnException: context.cloudflare.ctx.passThroughOnException,
  };
}
