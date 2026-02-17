import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/businesses/[id] - Get a specific business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const business = await prisma.business.findFirst({
      where: { id, userId: userId },
      include: {
        goals: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error fetching business:", error);
    return NextResponse.json(
      { error: "Failed to fetch business" },
      { status: 500 }
    );
  }
}

// PATCH /api/profile/businesses/[id] - Update a business
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const existing = await prisma.business.findFirst({
      where: { id, userId: userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, industry, isPrimary } = body;

    // If setting as primary, unset other primary businesses
    if (isPrimary && !existing.isPrimary) {
      await prisma.business.updateMany({
        where: { userId: userId, isPrimary: true },
        data: { isPrimary: false },
      });
    }

    const business = await prisma.business.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(industry !== undefined && { industry }),
        ...(isPrimary !== undefined && { isPrimary }),
      },
      include: {
        goals: true,
      },
    });

    return NextResponse.json(business);
  } catch (error) {
    console.error("Error updating business:", error);
    return NextResponse.json(
      { error: "Failed to update business" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/businesses/[id] - Delete a business
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const existing = await prisma.business.findFirst({
      where: { id, userId: userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    await prisma.business.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting business:", error);
    return NextResponse.json(
      { error: "Failed to delete business" },
      { status: 500 }
    );
  }
}
