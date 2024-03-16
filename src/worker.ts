import type { Fetcher, Request } from "@cloudflare/workers-types";

interface Env {
  ASSETS: Fetcher;
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

async function onPostLifgame(
  req: Request,
  env: Env,
  urlPatternResult: URLPatternResult,
) {
  return new Response("post: ok");
}

async function onGetLifgame(
  req: Request,
  env: Env,
  urlPatternResult: URLPatternResult,
) {
  return new Response("get: ok");
}

async function onDeleteLifgame(
  req: Request,
  env: Env,
  urlPatternResult: URLPatternResult,
) {
  return new Response("delete: ok");
}
