"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function EditProfile() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/seller/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    if (res.ok) {
      const data = await res.json();
      setProfile({ ...profile, logoUrl: data.url });
    } else {
      alert("Gagal upload logo.");
    }
    setUploading(false);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    
    // Tambahkan address dan phone ke dalam body
    const body = {
      name: fd.get("name"),
      description: fd.get("description"),
      city: fd.get("city"),
      province: fd.get("province"),
      website: fd.get("website"),
      yearEstablished: fd.get("yearEstablished") ? Number(fd.get("yearEstablished")) : null,
      address: fd.get("address"),
      phone: fd.get("phone"),
      exportCapability: fd.get("exportCapability") === "on",
      logoUrl: profile.logoUrl,
    };

    await fetch("/api/seller/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setSaving(false);
    router.push(`/${lang}/workspace/seller`);
    router.refresh();
  }

  if (loading) return <div className="p-8 text-center">Memuat profil...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Edit Profil Perusahaan</h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="flex items-center gap-4">
          <div className="flex h-24 w-40 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white overflow-hidden dark:border-neutral-700">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-xs text-neutral-400">Belum ada logo</span>
            )}
         </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Mengunggah..." : "Ubah Logo"}
            </Button>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Nama Perusahaan</label>
          <input name="name" defaultValue={profile.name} required className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>

        <div>
          <label className="text-sm font-medium">Deskripsi Perusahaan</label>
          <textarea name="description" defaultValue={profile.description || ""} rows={4} className="mt-1 w-full rounded-md border border-neutral-300 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" placeholder="Ceritakan tentang perusahaan Anda..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Kota</label>
            <input name="city" defaultValue={profile.city || ""} className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
          <div>
            <label className="text-sm font-medium">Provinsi</label>
            <input name="province" defaultValue={profile.province || ""} className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
        </div>

        {/* Website & Tahun Berdiri */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Website</label>
            <input name="website" defaultValue={profile.website || ""} placeholder="https://..." className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
          <div>
            <label className="text-sm font-medium">Tahun Berdiri</label>
            <input name="yearEstablished" type="number" defaultValue={profile.yearEstablished || ""} placeholder="2020" className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
        </div>

        {/* Alamat & Telepon */}
        <div>
          <label className="text-sm font-medium">Alamat Lengkap</label>
          <input name="address" defaultValue={profile.address || ""} placeholder="Jl. Contoh No. 123" className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>
        <div>
          <label className="text-sm font-medium">Nomor Telepon</label>
          <input name="phone" defaultValue={profile.phone || ""} placeholder="021-1234567 atau 08123456789" className="mt-1 h-11 w-full rounded-md border border-neutral-300 px-3 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" name="exportCapability" defaultChecked={profile.exportCapability} className="h-4 w-4" id="export" />
          <label htmlFor="export" className="text-sm font-medium">Perusahaan ini mampu melayani ekspor</label>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving}>{saving ? "Menyimpan..." : "Simpan Perubahan"}</Button>
          <Button type="button" variant="ghost" onClick={() => router.push(`/${lang}/workspace/seller`)}>Batal</Button>
        </div>
      </form>
    </div>
  );
}