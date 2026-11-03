import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  try {
    // 1. Cek Sesi Login (Wajib Login)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Ambil File dari FormData
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    // 3. Validasi Tipe File
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Hanya file gambar yang diizinkan" }, { status: 400 });
    }

    // 4. Konversi File ke Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. Upload ke Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "tradeindo" }, // Nama folder di Cloudinary
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    // 6. Kembalikan URL Cloudinary
    return NextResponse.json({ url: (uploadResult as any).secure_url });
    
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal mengunggah gambar" }, { status: 500 });
  }
}