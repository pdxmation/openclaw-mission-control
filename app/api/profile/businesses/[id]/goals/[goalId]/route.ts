import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/businesses/[id]/goals/[goalId] - Get a specific goal
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business belongs to user
    const business = await prisma.business.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const goal = await prisma.businessGoal.findFirst({
      where: { id: params.goalId, businessId: params.id },
    });

    if (!goal) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error fetching goal:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/businesses/[id]/goals/[goalId] - Update a goal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business belongs to user
    const business = await prisma.business.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const existing = await prisma.businessGoal.findFirst({
      where: { id: params.goalId, businessId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, targetDate, status } = body;

    const goal = await prisma.businessGoal.update({
      where: { id: params.goalId },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(targetDate !== undefined && { targetDate: targetDate ? new Date(targetDate) : null }),
        ...(status !== undefined && { status }),
      },
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error updating goal:", error);
    return NextResponse.json(
      { error: "Failed to update goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/businesses/[id]/goals/[goalId] - Delete a goal
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; goalId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify business belongs to user
    const business = await prisma.business.findFirst({
      where: { id: params.id, userId: session.user.id },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const existing = await prisma.businessGoal.findFirst({
      where: { id: params.goalId, businessId: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    }

    await prisma.businessGoal.delete({
      where: { id: params.goalId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return NextResponse.json(
      { error: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
