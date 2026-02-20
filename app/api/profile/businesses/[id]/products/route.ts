import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/businesses/[id]/products - List all products for a business
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id: businessId } = await params;

    // Verify the business belongs to the user
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: userId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const products = await prisma.product.findMany({
      where: { businessId: businessId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST /api/profile/businesses/[id]/products - Create a new product
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id: businessId } = await params;

    // Verify the business belongs to the user
    const business = await prisma.business.findFirst({
      where: { id: businessId, userId: userId },
    });

    if (!business) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, url, scrapedData } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        url,
        scrapedData,
        businessId: businessId,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
