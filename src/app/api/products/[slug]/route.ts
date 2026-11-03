import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { slug: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: params.slug },
      include: {
        company: true,
        category: true, // <-- TAMBAHKAN BARIS INI
        images: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}