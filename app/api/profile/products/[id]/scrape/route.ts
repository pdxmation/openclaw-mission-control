import { NextRequest, NextResponse } from "next/server";
import { authorizeAndGetUserId, unauthorizedResponse } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

// POST /api/profile/products/[id]/scrape - Scrape product URL and return extracted data
export async function POST(
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
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        business: {
          userId: userId,
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Validate URL
    let url: URL;
    try {
      url = new URL(product.url);
    } catch {
      return NextResponse.json(
        { error: "Invalid product URL" },
        { status: 400 }
      );
    }

    // Fetch the page content
    const response = await fetch(product.url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MissionControlBot/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();

    // Extract data from HTML
    const extractedData = extractDataFromHtml(html, product.url);

    // Update product with scraped data
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        scrapedData: extractedData.rawContent,
        description: extractedData.description || product.description,
      },
    });

    return NextResponse.json({
      product: updatedProduct,
      extracted: extractedData,
    });
  } catch (error) {
    console.error("Error scraping product:", error);
    return NextResponse.json(
      { error: "Failed to scrape product URL" },
      { status: 500 }
    );
  }
}

interface ExtractedData {
  title: string;
  metaDescription: string | null;
  description: string | null;
  rawContent: string;
}

function extractDataFromHtml(html: string, url: string): ExtractedData {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch?.[1]?.trim() || "";

  // Extract meta description
  const metaDescMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["'][^>]*>/i
  ) || html.match(
    /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
  ) || html.match(
    /<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:description["'][^>]*>/i
  );
  const metaDescription = metaDescMatch?.[1]?.trim() || null;

  // Extract main content - look for common content containers
  let mainContent = "";
  
  // Try to find main content areas
  const contentSelectors = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class=["'][^"']*main[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*>([\s\S]*?)<\/section>/i,
  ];

  for (const selector of contentSelectors) {
    const match = html.match(selector);
    if (match?.[1]) {
      mainContent = match[1];
      break;
    }
  }

  // If no main content found, use body
  if (!mainContent) {
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    mainContent = bodyMatch?.[1] || html;
  }

  // Clean up the content
  const cleanedContent = cleanHtmlContent(mainContent);

  // Create a summary description from meta or content
  let description = metaDescription;
  if (!description && cleanedContent) {
    // Take first 500 characters as description
    description = cleanedContent.slice(0, 500).trim();
    if (cleanedContent.length > 500) {
      description += "...";
    }
  }

  // Store raw HTML content for reference
  const rawContent = html.slice(0, 100000); // Limit to 100KB

  return {
    title,
    metaDescription,
    description,
    rawContent,
  };
}

function cleanHtmlContent(html: string): string {
  return (
    html
      // Remove script and style tags
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Remove other unwanted tags
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
      // Replace common tags with newlines
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/h[1-6]>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<li[^>]*>/gi, "\n- ")
      // Remove all remaining HTML tags
      .replace(/<[^>]+>/g, "")
      // Decode common HTML entities
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Normalize whitespace
      .replace(/\n\s*\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim()
  );
}
