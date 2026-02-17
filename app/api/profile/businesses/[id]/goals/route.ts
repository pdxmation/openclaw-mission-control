import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/businesses/[id]/goals - List all goals for a business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Verify business belongs to user
    const business = await prisma.business.findFirst({
      where: { id, userId: userId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const goals = await prisma.businessGoal.findMany({
      where: { businessId: id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error fetching goals:", error);
    return NextResponse.json(
      { error: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

// POST /api/profile/businesses/[id]/goals - Create a new goal
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;

    // Verify business belongs to user
    const business = await prisma.business.findFirst({
      where: { id, userId: userId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, targetDate, status } = body;

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const goal = await prisma.businessGoal.create({
      data: {
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status || "NOT_STARTED",
        businessId: id,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Error creating goal:", error);
    return NextResponse.json(
      { error: "Failed to create goal" },
      { status: 500 }
    );
  }
}
