import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

/**
 * GET /api/cron-jobs
 * List all cron jobs (read-only viewer)
 * 
 * Query params:
 * - agent?: string (filter by agentId)
 * - enabled?: boolean (filter by enabled status)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const agent = searchParams.get("agent");
    const enabled = searchParams.get("enabled");

    const where: any = {};

    if (agent) {
      where.agentId = agent;
    }

    if (enabled !== null && enabled !== undefined) {
      where.enabled = enabled === "true";
    }

    const jobs = await prisma.cronJob.findMany({
      where,
      orderBy: [
        { agentId: "asc" },
        { nextRunAt: "asc" },
      ],
    });

    return NextResponse.json({ jobs });
  } catch (error) {
    console.error("Error fetching cron jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch cron jobs" },
      { status: 500 }
    );
  }
}
