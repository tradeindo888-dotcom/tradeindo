import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findPlan, MAX_ACTIVE_SPONSORSHIPS } from "@/lib/sponsorship/plans";
import { countActiveSponsorships, findActiveSponsorshipForProduct } from "@/lib/sponsorship/queries";
import { z } from "zod";

const SubmitSchema = z.object({
  productId: z.string().cuid(),
  tier: z.enum(["STANDARD", "CATEGORY", "HOMEPAGE"]),
  durationDays: z.number().int().positive(),
  paymentProofUrl: z.string().min(1, "Bukti transfer wajib diunggah"),
  promoLabel: z.string().max(25).optional().nullable(), // <-- TAMBAHKAN INI
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "SUPPLIER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const companyId = (session.user as any).companyId;
  if (!companyId) return NextResponse.json({ error: "No company" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const parsed = SubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { productId, tier, durationDays, paymentProofUrl, promoLabel } = parsed.data;

  const plan = findPlan(tier, durationDays);
  if (!plan) return NextResponse.json({ error: "Plan tidak valid" }, { status: 400 });

  const product = await prisma.product.findFirst({ where: { id: productId, companyId } });
  if (!product) return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
  if (product.status === "DRAFT" || product.status === "REJECTED") return NextResponse.json({ error: "Produk belum aktif" }, { status: 400 });

  const company = await prisma.company.findUnique({ where: { id: companyId } });
  const planKey = (company?.plan ?? "FREE") as keyof typeof MAX_ACTIVE_SPONSORSHIPS;
  const maxActive = MAX_ACTIVE_SPONSORSHIPS[planKey];
  const activeCount = await countActiveSponsorships(companyId);

  const existingForProduct = await findActiveSponsorshipForProduct(productId);
  if (!existingForProduct && activeCount >= maxActive) {
    return NextResponse.json({ error: `Batas sponsorship aktif (${maxActive}) tercapai.` }, { status: 403 });
  }

  const pendingForProduct = await prisma.sponsoredRequest.findFirst({ where: { productId, status: "PENDING" } });
  if (pendingForProduct) return NextResponse.json({ error: "Sudah ada pengajuan pending." }, { status: 409 });

  const request = await prisma.sponsoredRequest.create({
    data: { 
      productId, 
      companyId, 
      tier, 
      durationDays, 
      price: plan.price, 
      paymentProofUrl, 
      promoLabel: promoLabel || null, // <-- SIMPAN KE DATABASE
      status: "PENDING" 
    },
  });

  return NextResponse.json({ success: true, requestId: request.id });
}