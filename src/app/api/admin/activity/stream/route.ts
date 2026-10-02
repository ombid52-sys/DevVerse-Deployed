import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { auditEmitter } from "@/lib/audit";
import { ActivityLog } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user || user.role !== "ADMIN") {
      return new Response("Unauthorized", { status: 401 });
    }

    const encoder = new TextEncoder();
    let isClosed = false;

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connect message
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "CONNECTED" })}\n\n`));

        const onLog = (log: ActivityLog) => {
          if (isClosed) return;
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "LOG", log })}\n\n`)
            );
          } catch {
            isClosed = true;
            auditEmitter.off("log", onLog);
          }
        };

        auditEmitter.on("log", onLog);

        // Keep-alive heartbeat every 15 seconds
        const keepAlive = setInterval(() => {
          if (isClosed) {
            clearInterval(keepAlive);
            return;
          }
          try {
            controller.enqueue(encoder.encode(": keepalive\n\n"));
          } catch {
            isClosed = true;
            clearInterval(keepAlive);
            auditEmitter.off("log", onLog);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          isClosed = true;
          clearInterval(keepAlive);
          auditEmitter.off("log", onLog);
          try {
            controller.close();
          } catch {
            // ignore
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response("Error establishing event stream", { status: 500 });
  }
}
