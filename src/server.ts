import "./lib/error-capture";
import serverEntryModule from "@tanstack/react-start/server-entry";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

const serverEntry = ((serverEntryModule as Record<string, unknown>).default ??
  serverEntryModule) as ServerEntry;

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = serverEntry;
      const rawResponse = await handler.fetch(request, env, ctx);
      const response = await normalizeCatastrophicSsrResponse(rawResponse);

      const secureHeaders = new Headers(response.headers);
      secureHeaders.set("X-Content-Type-Options", "nosniff");
      secureHeaders.set("X-Frame-Options", "SAMEORIGIN");
      secureHeaders.set("Referrer-Policy", "strict-origin-when-cross-origin");
      secureHeaders.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), payment=*",
      );

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: secureHeaders,
      });
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "SAMEORIGIN",
        },
      });
    }
  },
};
