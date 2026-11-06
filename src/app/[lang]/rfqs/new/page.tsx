"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function NewRfqPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LOGIKA AUTO-FILL DARI URL (Mencegah error jika product.moq = null)
  const initialQuantity = searchParams.get("quantity") || searchParams.get("moq") || "";
  const initialTitle = searchParams.get("title") || "";

  const [form, setForm] = useState({
    title: initialTitle,
    description: "",
    categoryId: "",
    quantity: initialQuantity !== "null" ? initialQuantity : "", // Jika "null", kosongkan
    quantityUnit: "pcs",
    targetPrice: "",
    targetPriceMax: "",
    deliveryCity: "",
    deadlineAt: "",
    verifiedOnly: false,
  });

  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  // ... (Kode useEffect dan handleSubmit Anda tetap sama) ...
  // Anda bisa copy paste fungsi useEffect dan handleSubmit dari kode lama Anda.