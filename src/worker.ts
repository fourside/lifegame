import type { Fetcher, KVNamespace, Request } from "@cloudflare/workers-types";
import { validate } from "superstruct";
import { compress, decompress } from "./gzip";
import { LifegameSchema } from "./lifegame";

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

async function onGetLifgame(
  _: Request,
  env: Env,
  urlPatternResult: URLPatternResult,
) {
  const id = urlPatternResult.pathname.groups.id;
  if (id === undefined) {
    return new Response("routing mismatch: id not found", { status: 500 });
  }
  const value = await env.LIFEGAME.get(id, "arrayBuffer");
  if (value === null) {
    return new Response("not found", { status: 404 });
  }
  const str = await decompress(value);
  try {
    const json = JSON.parse(str);
    const [err, lifegame] = validate(json, LifegameSchema);
    if (err !== undefined) {
      console.error(err);
      return new Response("invalid post body", { status: 400 });
    }
    return new Response(JSON.stringify(lifegame), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("error", { status: 400 });
  }
}

async function sha256(source: string): Promise<string> {
  const a = new TextEncoder().encode(source);
  const b = await crypto.subtle.digest("SHA-256", a);
  return Array.from(new Uint8Array(b))
    .map((it) => it.toString(16).padStart(2, "0"))
    .join("");
}
