"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export default function EditProfile() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "w-full h-11 rounded-md border border-neutral-300 px-3 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  useEffect(() => {
    fetch("/api/seller/profile")
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Gagal memuat profil.");
        setLoading(false);
      });
  }, []);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      return toast.error("Ukuran gambar maksimal 5MB.");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload/public", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile({ ...profile, logoUrl: data.url });
      toast.success("Logo berhasil diunggah.");
    } catch {
      toast.error("Gagal upload logo.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    
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

    try {
      const res = await fetch("/api/seller/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();
      
      toast.success("Profil perusahaan berhasil diperbarui!");
      router.push(`/${lang}/workspace/seller`);
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-neutral-500">Memuat profil...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">Edit Profil Perusahaan</h1>
      
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Logo Upload */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="flex h-32 w-48 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white overflow-hidden dark:border-neutral-700 dark:bg-neutral-900">
            {profile.logoUrl ? (
              <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain p-2" />
            ) : (
              <span className="text-xs text-neutral-400">Belum ada logo</span>
            )}
         </div>
          <div className="flex flex-col gap-2">
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
            <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              {uploading ? "Mengunggah..." : "Ubah Logo"}
            </Button>
            <p className="text-xs text-neutral-500">Maksimal 5MB. Format JPG/PNG.</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Nama Perusahaan</label>
          <input name="name" defaultValue={profile.name} required className={inputClass} />
        </div>

        <div>
          <label className="text-sm font-medium block mb-1">Deskripsi Perusahaan</label>
          <textarea name="description" defaultValue={profile.description || ""} rows={4} className={`${inputClass} h-auto py-3`} placeholder="Ceritakan tentang perusahaan Anda..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Kota</label>
            <input name="city" defaultValue={profile.city || ""} className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Provinsi</label>
            <input name="province" defaultValue={profile.province || ""} className={inputClass} />
          </div>
        </div>

        {/* Website & Tahun Berdiri */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium block mb-1">Website</label>
            <input name="website" defaultValue={profile.website || ""} placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">Tahun Berdiri</label>
            <input name="yearEstablished" type="number" defaultValue={profile.yearEstablished || ""} placeholder="2020" className={inputClass} />
          </div>
        </div>

        {/* Alamat & Telepon */}
        <div>
          <label className="text-sm font-medium block mb-1">Alamat Lengkap</label>
          <input name="address" defaultValue={profile.address || ""} placeholder="Jl. Contoh No. 123" className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Nomor Telepon</label>
          <input name="phone" defaultValue={profile.phone || ""} placeholder="021-1234567 atau 08123456789" className={inputClass} />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input type="checkbox" name="exportCapability" defaultChecked={profile.exportCapability} className="h-4 w-4 accent-forest-700 rounded border-neutral-300" id="export" />
          <label htmlFor="export" className="text-sm font-medium cursor-pointer">Perusahaan ini mampu melayani ekspor</label>
        </div>

        <div className="flex gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
          <Button type="submit" disabled={saving} className="flex-1 h-11">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push(`/${lang}/workspace/seller`)} className="h-11">Batal</Button>
        </div>
      </form>
    </div>
  );
}