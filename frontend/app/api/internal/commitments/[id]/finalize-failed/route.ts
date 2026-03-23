/**
 * This file proxies the demo-only failed-finalization action from Next.js to the backend.
 * It exists to keep the internal backend API key server-side while still exposing the action in the demo UI.
 * It fits the system by letting operators test the full failure flow without weakening browser security.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { getFrontendServerConfig } from "@/lib/server-env";

const paramsSchema = z.object({
  id: z.string().uuid()
});

/**
 * This function forwards one failed-finalization request to the backend using the internal API key.
 * It receives the Next.js route params containing the off-chain commitment id.
 * It returns the backend response body and status code as-is when possible.
 * It is important because the demo frontend needs an internal-only control path without exposing secrets in client code.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = paramsSchema.parse(await context.params);
  const serverConfig = getFrontendServerConfig();
  const response = await fetch(
    `${serverConfig.API_URL}/commitments/${params.id}/finalize-failed`,
    {
      body: JSON.stringify({}),
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": serverConfig.INTERNAL_API_KEY
      },
      method: "POST"
    }
  );

  const responseText = await response.text();
  const payload = responseText.length > 0 ? JSON.parse(responseText) : {};

  return NextResponse.json(payload, {
    status: response.status
  });
}
