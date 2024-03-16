import type { Fetcher, KVNamespace, Request } from "@cloudflare/workers-types";
import { type Describe, array, number, object, validate } from "superstruct";
import type { Lifegame } from "./cell";

interface Env {
  ASSETS: Fetcher;
  LIFEGAME: KVNamespace;
}

type Handler = (
  request: Request,
  env: Env,
  urlpatternResult: URLPatternResult,
) => Promise<Response>;

type Route = {
  urlPattern: URLPattern;
  handlers: Record<string, Handler>;
};

const routes: Route[] = [
  {
    urlPattern: new URLPattern({ pathname: "/api/lifegames" }),
    handlers: {
      POST: onPostLifgame,
    },
  },
  {
    urlPattern: new URLPattern({ pathname: "/api/lifegames/:id" }),
    handlers: {
      GET: onGetLifgame,
      DEELTE: onDeleteLifgame,
    },
  },
];

export default {
  async fetch(request: Request, env: Env) {
    const found = findRoute(request.url, request.method);
    if (found === undefined) {
      // serve the static assets.
      return env.ASSETS.fetch(request);
    }
    const [matchPattern, handler] = found;
    if (handler === undefined) {
      return new Response("not allowed", {
        status: 405,
      });
    }
    return await handler(request, env, matchPattern);
  },
};

function findRoute(
  url: string,
  method: string,
): [URLPatternResult, Handler | undefined] | undefined {
  for (const route of routes) {
    const mathPattern = route.urlPattern.exec(url);
    if (mathPattern !== null) {
      return [mathPattern, route.handlers[method]];
    }
  }
  return undefined;
}

const LifegameSchema: Describe<Lifegame> = object({
  width: number(),
  height: number(),
  aliveCells: array(
    object({
      i: number(),
      j: number(),
    }),
  ),
});

async function onPostLifgame(req: Request, env: Env, _: URLPatternResult) {
  const json = await req.json();
  const [err, lifegame] = validate(json, LifegameSchema);
  if (err !== undefined) {
    console.error(err);
    return new Response("invalid post body", { status: 400 });
  }
  const lifegameStr = JSON.stringify(lifegame);
  const key = await sha256(lifegameStr);
  const value = await compress(lifegameStr);
  await env.LIFEGAME.put(key, value);
  return new Response(undefined, {
    status: 201,
    headers: {
      location: `/${key}`,
    },
  });
}

async function onGetLifgame(_: Request, __: Env, ___: URLPatternResult) {
  return new Response("get: ok");
}

async function onDeleteLifgame(_: Request, __: Env, ___: URLPatternResult) {
  return new Response("delete: ok");
}

async function sha256(source: string): Promise<string> {
  const a = new TextEncoder().encode(source);
  const b = await crypto.subtle.digest("SHA-256", a);
  return Array.from(new Uint8Array(b))
    .map((it) => it.toString(16).padStart(2, "0"))
    .join("");
}

async function compress(source: string): Promise<ArrayBuffer> {
  const a = new TextEncoder().encode(source);
  const compressionStream = new CompressionStream("gzip");
  const writer = compressionStream.writable.getWriter();
  await writer.write(a);
  await writer.close();
  const blob = await new Response(compressionStream.readable).blob();
  return blob.arrayBuffer();
}
