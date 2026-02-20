import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/profile/products/[id] - Update a product
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id: productId } = await params;

    // Verify the product belongs to the user's business
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        business: {
          userId: userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, url, scrapedData } = body;

    // Validate URL if provided
    if (url !== undefined) {
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL format" },
          { status: 400 }
        );
      }
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(url !== undefined && { url }),
        ...(scrapedData !== undefined && { scrapedData }),
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/products/[id] - Delete a product
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const userId = await authorizeAndGetUserId(req);
    if (!userId) {
      return unauthorizedResponse();
    }

    const { id: productId } = await params;

    // Verify the product belongs to the user's business
    const existing = await prisma.product.findFirst({
      where: {
        id: productId,
        business: {
          userId: userId,
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id: productId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}
