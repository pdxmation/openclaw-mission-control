import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/cron-jobs/sync
 * Sync cron jobs from OpenClaw Gateway (via MAIN agent)
 * 
 * Headers:
 * - Authorization: Bearer <API_TOKEN>
 * - X-Agent-Source: MAIN (or other agent name)
 * 
 * Body:
 * {
 *   jobs: Array<{
 *     id: string
 *     agentId: string
 *     name: string
 *     enabled: boolean
 *     schedule: { kind: string, expr?: string, everyMs?: number, at?: string, tz?: string }
 *     payload: { kind: string, message?: string }
 *     delivery?: { mode?: string, to?: string, channel?: string }
 *     state: { nextRunAtMs: number, lastRunAtMs?: number, lastRunStatus?: string, lastDurationMs?: number, consecutiveErrors: number }
 *   }>
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get("authorization");
    const apiKey = authHeader?.replace("Bearer ", "");

    if (!apiKey) {
      return NextResponse.json(
        { error: "Authorization required" },
        { status: 401 }
      );
    }

    // Validate against environment API_TOKEN
    const expectedToken = process.env.API_TOKEN;
    if (!expectedToken || apiKey !== expectedToken) {
      return NextResponse.json(
        { error: "Invalid API token" },
        { status: 403 }
      );
    }

    // Optional: validate agent source
    const agentSource = request.headers.get("x-agent-source");
    console.log(`[Cron Sync] Received sync from agent: ${agentSource || "unknown"}`);

    const body = await request.json();
    const { jobs } = body;

    if (!Array.isArray(jobs)) {
      return NextResponse.json(
        { error: "Invalid payload: jobs array required" },
        { status: 400 }
      );
    }

    console.log(`[Cron Sync] Syncing ${jobs.length} cron jobs`);

    // Process each job - upsert by id
    const results = [];
    for (const job of jobs) {
      try {
        const data = {
          agentId: job.agentId,
          name: job.name,
          enabled: job.enabled,
          scheduleKind: job.schedule.kind,
          scheduleExpr: job.schedule.expr,
          scheduleEveryMs: job.schedule.everyMs,
          scheduleAt: job.schedule.at ? new Date(job.schedule.at) : null,
          scheduleTz: job.schedule.tz,
          payloadKind: job.payload.kind,
          payloadMessage: job.payload.message,
          deliveryMode: job.delivery?.mode,
          deliveryTo: job.delivery?.to,
          deliveryChannel: job.delivery?.channel,
          nextRunAt: new Date(job.state.nextRunAtMs),
          lastRunAt: job.state.lastRunAtMs ? new Date(job.state.lastRunAtMs) : null,
          lastRunStatus: job.state.lastRunStatus,
          lastDurationMs: job.state.lastDurationMs,
          consecutiveErrors: job.state.consecutiveErrors || 0,
        };

        const upserted = await prisma.cronJob.upsert({
          where: { id: job.id },
          update: data,
          create: {
            id: job.id,
            ...data,
          },
        });

        results.push({ id: job.id, status: "ok" });
      } catch (error: any) {
        console.error(`[Cron Sync] Error upserting job ${job.id}:`, error.message);
        results.push({ id: job.id, status: "error", error: error.message });
      }
    }

    const successCount = results.filter((r) => r.status === "ok").length;
    const errorCount = results.filter((r) => r.status === "error").length;

    console.log(`[Cron Sync] Completed: ${successCount} ok, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      synced: successCount,
      errors: errorCount,
      results,
    });
  } catch (error: any) {
    console.error("[Cron Sync] Unexpected error:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error.message },
      { status: 500 }
    );
  }
}
