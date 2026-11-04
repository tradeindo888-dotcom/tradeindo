"use client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import Cropper from "react-easy-crop";
import getCroppedImg from "@/lib/cropImage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminTabs({ 
  subscriptions, companies, sponsors, users, pendingBanners = [], consumerReports = [], 
  adRevenueChartData = [], currentMonthAdRevenue = 0,
  subscriptionChartData = [], currentMonthSubRevenue = 0,
  totalRevenueChartData = [], currentMonthTotalRevenue = 0,
  userChartData = [], totalUsers = 0,
  lang = "id"
}: { 
  subscriptions: any[]; companies: any[]; sponsors: any[]; users: any[]; pendingBanners?: any[]; consumerReports?: any[]; 
  adRevenueChartData?: any[]; currentMonthAdRevenue?: number;
  subscriptionChartData?: any[]; currentMonthSubRevenue?: number;
  totalRevenueChartData?: any[]; currentMonthTotalRevenue?: number;
  userChartData?: any[]; totalUsers?: number;
  lang?: string;
}) {
  const [activeTab, setActiveTab] = useState<"subscriptions" | "companies" | "sponsors" | "users" | "banners" | "pending_banners" | "reports" | "ad_revenue" | "sub_revenue" | "total_revenue" | "user_growth">("subscriptions");
  
  // State Modal Verifikasi
  const [reviewCompany, setReviewCompany] = useState<any>(null);
  const [selectedDocImage, setSelectedDocImage] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);
  
  // State Lokal (Untuk Update UI Instan)
  const [localSubscriptions, setLocalSubscriptions] = useState(subscriptions);
  const [localCompanies, setLocalCompanies] = useState(companies);
  const [localUsers, setLocalUsers] = useState(users);
  const [localPendingBanners, setLocalPendingBanners] = useState(pendingBanners);
  const [localReports, setLocalReports] = useState(consumerReports);
  
  // State Suspend/Ban
  const [actionUser, setActionUser] = useState<any>(null);
  const [actionType, setActionType] = useState<"ACTIVE" | "SUSPENDED" | "BANNED">("SUSPENDED");
  const [suspendReason, setSuspendReason] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  // State Banner Admin
  const [banners, setBanners] = useState<any[]>([]);
  const [loadingBanners, setLoadingBanners] = useState(false);
  const [editBannerId, setEditBannerId] = useState<string | null>(null); 
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerLink, setBannerLink] = useState("");
  const [bannerOrder, setBannerOrder] = useState(1);
  const [bannerDuration, setBannerDuration] = useState(30);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  // State Crop Gambar
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);

  // State untuk Laporan Konsumen
  const [updatingReportId, setUpdatingReportId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => { setLocalSubscriptions(subscriptions); }, [subscriptions]);
  useEffect(() => { setLocalCompanies(companies); }, [companies]);
  useEffect(() => { setLocalUsers(users); }, [users]);
  useEffect(() => { setLocalPendingBanners(pendingBanners); }, [pendingBanners]);
  useEffect(() => { setLocalReports(consumerReports); }, [consumerReports]);

  useEffect(() => {
    if (activeTab === "banners") fetchBanners();
  }, [activeTab]);

  const fetchBanners = () => {
    setLoadingBanners(true);
    fetch("/api/admin/banners").then(res => res.json()).then(data => { if (Array.isArray(data)) setBanners(data); setLoadingBanners(false); }).catch(() => setLoadingBanners(false));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { setReviewCompany(null); setSelectedDocImage(null); setActionUser(null); setIsCropping(false); } };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // --- FUNGSI PERSETUJUAN LANGGANAN (FETCH API) ---
  async function handleSubscriptionAction(id: string, action: "approve" | "reject") {
    if (!confirm(`Yakin ingin ${action === "approve" ? "Menyetujui" : "Menolak"} pengajuan ini?`)) return;
    
    try {
      const res = await fetch("/api/admin/verify-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: id, action })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses");
      
      toast.success(action === "approve" ? "Langganan berhasil disetujui!" : "Langganan ditolak.");
      // Update tabel secara instan tanpa reload
      setLocalSubscriptions(prev => prev.filter(s => s.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Gagal memproses pengajuan.");
    }
  }

  // --- FUNGSI CROP & UPLOAD BANNER (ADMIN) ---
  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImageSrc(URL.createObjectURL(file)); setIsCropping(true); e.target.value = ""; 
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (croppedFile) { setBannerFile(croppedFile); setBannerPreview(URL.createObjectURL(croppedFile)); }
      setIsCropping(false); setImageSrc(null);
    } catch (e) { toast.error("Gagal memotong gambar."); }
  };

  async function handleSubmitBanner(e: React.FormEvent) {
    e.preventDefault();
    if (!editBannerId && !bannerFile) return toast.error("Pilih gambar banner.");
    setUploadingBanner(true);
    try {
      let finalImageUrl = null;
      if (bannerFile) {
        const fd = new FormData(); fd.append("file", bannerFile);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json(); finalImageUrl = uploadData.url;
      }
      
      const payload = { 
        imageUrl: finalImageUrl, 
        title: bannerTitle, 
        linkUrl: bannerLink, 
        order: bannerOrder, 
        durationDays: bannerDuration,
        type: "CAROUSEL" 
      };

      if (editBannerId) {
        const res = await fetch(`/api/admin/banners/${editBannerId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(); toast.success("Banner berhasil diupdate!");
      } else {
        const res = await fetch("/api/admin/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error(); toast.success("Banner berhasil ditambahkan!");
      }
      resetFormBanner(); fetchBanners();
    } catch (err) { toast.error("Terjadi kesalahan."); } finally { setUploadingBanner(false); }
  }

  const handleEditClick = (banner: any) => {
    setEditBannerId(banner.id); 
    setBannerTitle(banner.title || ""); 
    setBannerLink(banner.linkUrl || ""); 
    setBannerOrder(banner.order || 1); 
    if (banner.endDate) {
      const diff = new Date(banner.endDate).getTime() - new Date().getTime();
      const daysLeft = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      setBannerDuration(daysLeft);
    } else {
      setBannerDuration(30);
    }
    setBannerPreview(banner.imageUrl); 
    setBannerFile(null); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetFormBanner = () => { 
    setEditBannerId(null); setBannerFile(null); setBannerPreview(null); 
    setBannerTitle(""); setBannerLink(""); setBannerOrder(1); setBannerDuration(30); 
  };

  async function handleDeleteBanner(id: string) {
    if (!confirm("Hapus banner ini?")) return;
    try { const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error(); toast.success("Banner dihapus."); setBanners(prev => prev.filter(b => b.id !== id)); } catch (err) { toast.error("Gagal menghapus."); }
  }

  // --- FUNGSI PERSETUJUAN BANNER CUSTOMER ---
  async function handleFinishBanner(id: string) {
    if (!confirm("Tandai antrean ini selesai dan hapus? Pastikan Anda SUDAH mengunggah banner buatan customer di tab 'Kelola Banner'.")) return;
    try { 
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" }); 
      if (!res.ok) throw new Error(); 
      toast.success("Antrean selesai. Iklan manual Anda sudah aktif."); 
      setLocalPendingBanners(prev => prev.filter(b => b.id !== id)); 
    } catch (err) { toast.error("Gagal menyelesaikan antrean."); }
  }

  async function handleRejectBanner(id: string) {
    if (!confirm("Tolak pengajuan iklan ini?")) return;
    try { const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" }); if (!res.ok) throw new Error(); toast.success("Pengajuan iklan ditolak."); setLocalPendingBanners(prev => prev.filter(b => b.id !== id)); } catch (err) { toast.error("Gagal menolak."); }
  }

  // --- FUNGSI VERIFIKASI & SUSPEND ---
  async function handleVerify(action: "approve" | "reject") {
    if (action === "reject" && rejectReason.length < 5) return toast.error("Alasan wajib diisi.");
    setProcessing(true);
    try {
      const res = await fetch("/api/admin/verify", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ companyId: reviewCompany.id, action, reason: rejectReason }) });
      if (!res.ok) throw new Error(); toast.success(`Verifikasi berhasil!`);
      setLocalCompanies(prev => prev.map(c => c.id === reviewCompany.id ? { ...c, verificationStatus: action === "approve" ? "VERIFIED" : "REJECTED", verificationRequests: [] } : c));
      setReviewCompany(null); setRejectReason("");
    } catch (err) { toast.error("Gagal memproses."); } finally { setProcessing(false); }
  }

  async function handleUpdateStatus() {
    if (!actionUser) return;
    if (actionType !== "ACTIVE" && suspendReason.length < 5) return toast.error("Alasan wajib diisi.");
    setSavingUser(true);
    try {
      const res = await fetch(`/api/admin/users/${actionUser.id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: actionType, reason: suspendReason }) });
      if (!res.ok) throw new Error(); toast.success(`Status akun diubah.`);
      setLocalUsers(prev => prev.map(u => u.id === actionUser.id ? { ...u, status: actionType } : u)); setActionUser(null);
    } catch (err) { toast.error("Gagal mengubah status."); } finally { setSavingUser(false); }
  }

  // --- FUNGSI UPDATE LAPORAN KONSUMEN ---
  async function handleUpdateReportStatus(id: string, newStatus: "RESOLVED" | "REJECTED") {
    if (replyingTo !== id) { setReplyingTo(id); setReplyText(""); return; }
    setUpdatingReportId(id);
    try {
      const res = await fetch(`/api/admin/consumer-reports`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus, adminReply: replyText }) });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gagal update");
      
      toast.success(newStatus === "RESOLVED" ? "Laporan Selesai. Pesan berhasil dikirim ke Inbox pelapor." : "Laporan Ditolak. Pesan berhasil dikirim ke Inbox pelapor.");
      
      setLocalReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminReply: replyText } : r));
      setReplyingTo(null); setReplyText("");
    } catch (err: any) { 
      toast.error(err.message || "Gagal memperbarui status."); 
    } finally { 
      setUpdatingReportId(null); 
    }
  }

  // --- FUNGSI HAPUS LAPORAN ---
  async function handleDeleteReport(id: string) {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini secara permanen?")) return;
    try {
      const res = await fetch(`/api/admin/consumer-reports`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error();
      toast.success("Laporan berhasil dihapus.");
      setLocalReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast.error("Gagal menghapus laporan.");
    }
  }

  return (
    <div className="mt-2">
      {/* BANNER TOTAL PENERIMAAN */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-xl p-5 text-white shadow-lg mb-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-indigo-50 flex items-center gap-2">
            💰 Total Penerimaan Bulan Ini
          </h2>
          <p className="text-sm text-indigo-200">Gabungan dari Pendapatan Iklan + Langganan</p>
        </div>
        <div className="text-3xl font-black tabular-nums bg-white/10 px-6 py-2 rounded-lg border border-white/20">
          Rp {currentMonthTotalRevenue.toLocaleString("id-ID")}
        </div>
      </div>

      {/* TOMBOL TAB */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-4 overflow-x-auto">
        <button onClick={() => setActiveTab("subscriptions")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "subscriptions" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Langganan ({localSubscriptions.length})</button>
        <button onClick={() => setActiveTab("companies")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "companies" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Verifikasi PT ({localCompanies.length})</button>
        <button onClick={() => setActiveTab("sponsors")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "sponsors" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Iklan Produk ({sponsors.length})</button>
        <button onClick={() => setActiveTab("pending_banners")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "pending_banners" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Persetujuan Iklan ({localPendingBanners.length})</button>
        <button onClick={() => setActiveTab("users")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "users" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Akun ({localUsers.length})</button>
        <button onClick={() => setActiveTab("banners")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "banners" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Kelola Banner</button>
        <button onClick={() => setActiveTab("reports")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "reports" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>Laporan Konsumen ({localReports.length})</button>
        <button onClick={() => setActiveTab("ad_revenue")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "ad_revenue" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>📊 Pendapatan Iklan</button>
        <button onClick={() => setActiveTab("sub_revenue")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "sub_revenue" ? "border-forest-700 text-forest-700 dark:border-lime-400 dark:text-lime-400" : "border-transparent text-neutral-500"}`}>📈 Pendapatan Langganan</button>
        <button onClick={() => setActiveTab("total_revenue")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "total_revenue" ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" : "border-transparent text-neutral-500"}`}>💎 Total Penerimaan</button>
        <button onClick={() => setActiveTab("user_growth")} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === "user_growth" ? "border-purple-600 text-purple-600 dark:border-purple-400 dark:text-purple-400" : "border-transparent text-neutral-500"}`}>👥 Pertumbuhan User</button>
      </div>

      {/* TAB 1: LANGGANAN (FIXED) */}
      {activeTab === "subscriptions" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr><th className="p-3">Perusahaan</th><th className="p-3">Paket</th><th className="p-3">Tanggal</th><th className="p-3">Bukti</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {localSubscriptions.map((req) => (
                <tr key={req.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3 font-medium">{req.company.name}</td>
                  <td className="p-3"><span className="bg-forest-700 text-white px-2 py-0.5 text-xs rounded-sm">{req.requestedPlan}</span></td>
                  <td className="p-3">{new Date(req.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="p-3">{req.paymentProofUrl ? <a href={req.paymentProofUrl} target="_blank" className="text-blue-600 underline text-xs">Lihat</a> : "-"}</td>
                  <td className="p-3 flex gap-2">
                    <button 
                      onClick={() => handleSubscriptionAction(req.id, "approve")}
                      className="bg-forest-700 px-3 py-1 text-white text-xs rounded hover:bg-forest-500"
                    >
                      Setujui
                    </button>
                    <button 
                      onClick={() => handleSubscriptionAction(req.id, "reject")}
                      className="border border-red-500 text-red-500 px-3 py-1 text-xs rounded hover:bg-red-50"
                    >
                      Tolak
                    </button>
                  </td>
                </tr>
              ))}
              {localSubscriptions.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-neutral-500">Tidak ada pengajuan.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 2: VERIFIKASI PT */}
      {activeTab === "companies" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr><th className="p-3">Nama Perusahaan</th><th className="p-3">Tipe</th><th className="p-3">Status</th><th className="p-3 text-right">Aksi</th></tr>
            </thead>
            <tbody>
              {localCompanies.map((c) => (
                <tr key={c.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3">{c.type}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 text-xs rounded-full ${c.verificationStatus === "VERIFIED" ? "bg-green-100 text-green-800" : c.verificationStatus === "PENDING" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{c.verificationStatus}</span></td>
                  <td className="p-3 text-right">
                    {c.verificationStatus === "PENDING" ? (
                      <button onClick={() => setReviewCompany(c)} className="bg-forest-700 text-white px-4 py-1.5 rounded-md text-xs font-bold hover:bg-forest-500 transition-colors shadow-sm">🔍 Periksa Dokumen</button>
                    ) : c.verificationStatus === "VERIFIED" ? (<span className="text-green-600 text-xs font-medium">✓ Terverifikasi</span>) : (<span className="text-red-500 text-xs font-medium">Ditolak</span>)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: IKLAN PRODUK */}
      {activeTab === "sponsors" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr><th className="p-3">Perusahaan</th><th className="p-3">Produk</th><th className="p-3">Durasi</th><th className="p-3">Total</th><th className="p-3">Bukti</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {sponsors.map((req: any) => {
                const imgUrl = req.product?.images?.[0]?.url;
                return (
                  <tr key={req.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                    <td className="p-3 font-medium">{req.company?.name ?? "-"}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-md border border-neutral-200 bg-neutral-100 overflow-hidden relative group cursor-pointer" onClick={() => imgUrl && setSelectedDocImage(imgUrl)}>
                          {imgUrl ? (<><img src={imgUrl} alt={req.product.titleId} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></div></>) : (<div className="h-full w-full flex items-center justify-center text-[10px] text-neutral-400">No Img</div>)}
                        </div>
                        <span className="line-clamp-2">{req.product?.titleId ?? "-"}</span>
                      </div>
                    </td>
                    <td className="p-3">{req.durationDays} Hari</td>
                    <td className="p-3 tabular-nums">Rp {req.price.toLocaleString("id-ID")}</td>
                    <td className="p-3">{req.paymentProofUrl ? <a href={req.paymentProofUrl} target="_blank" className="text-blue-600 underline text-xs">Lihat</a> : "-"}</td>
                    <td className="p-3 flex flex-wrap gap-2 items-start">
                      <form action="/api/admin/verify-sponsor" method="POST" className="inline-flex items-center gap-1"><input type="hidden" name="requestId" value={req.id} /><input type="hidden" name="action" value="approve" /><input type="hidden" name="returnTo" value={`/${lang}/admin`} /><button className="bg-forest-700 px-3 py-1 text-white text-xs rounded hover:bg-forest-500">Setujui</button></form>
                      <details className="inline-block relative">
                        <summary className="cursor-pointer border border-red-500 text-red-500 px-3 py-1 text-xs rounded list-none hover:bg-red-50">Tolak</summary>
                        <form action="/api/admin/verify-sponsor" method="POST" className="mt-2 space-y-1 bg-white p-2 border rounded absolute right-0 z-20 shadow-lg w-48">
                          <input type="hidden" name="requestId" value={req.id} /><input type="hidden" name="action" value="reject" /><input type="hidden" name="returnTo" value={`/${lang}/admin`} />
                          <select name="rejectedReason" required className="text-xs border rounded px-2 py-1 w-full"><option value="">— Pilih alasan —</option><option value="Nominal tidak sesuai">Nominal tidak sesuai</option><option value="Bukti tidak jelas">Bukti tidak jelas</option><option value="Bukti duplikat">Bukti duplikat</option><option value="Produk melanggar ToS">Produk melanggar ToS</option></select>
                          <button className="bg-red-500 text-white text-xs rounded px-2 py-1 w-full hover:bg-red-600">Konfirmasi Tolak</button>
                        </form>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {sponsors.length === 0 && (<tr><td colSpan={6} className="p-4 text-center text-neutral-500">Tidak ada pengajuan iklan.</td></tr>)}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 4: PERSETUJUAN IKLAN BANNER */}
      {activeTab === "pending_banners" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <div className="bg-blue-50 text-blue-800 p-4 text-sm dark:bg-blue-900/30 dark:text-blue-300 border-b dark:border-neutral-800">
            <strong>Instruksi Admin:</strong> 
            <ol className="list-decimal pl-5 mt-1 space-y-1">
              <li>Klik <strong>Download Gambar</strong> di bawah untuk menyimpan banner mentah dari customer.</li>
              <li>Buka tab <strong>Kelola Banner</strong>, unggah gambar tersebut dan gunakan fitur potong (Crop 16:9).</li>
              <li>Setelah banner baru tayang, kembali ke sini dan klik tombol <strong>Selesai & Hapus</strong>.</li>
            </ol>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr><th className="p-3">Perusahaan</th><th className="p-3">Gambar Banner (Mentah)</th><th className="p-3">Bukti TF</th><th className="p-3">Durasi & Harga</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {localPendingBanners.map((b) => (
                <tr key={b.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3 font-medium">{b.company?.name || "-"}</td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      <img src={b.imageUrl} alt="Banner" className="h-16 w-32 object-cover rounded border cursor-pointer" onClick={() => setSelectedDocImage(b.imageUrl)} />
                      <a 
                        href={b.imageUrl} 
                        download={`Banner-${b.company?.name || "Customer"}.jpg`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-forest-700 hover:underline flex items-center gap-1 w-fit bg-forest-50 px-2 py-1 rounded border border-forest-200"
                      >
                        ⬇️ Download Gambar
                      </a>
                    </div>
                  </td>
                  <td className="p-3"><a href={b.paymentProofUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">Lihat Bukti</a></td>
                  <td className="p-3"><div className="font-bold">{b.durationDays} Hari</div><div className="text-xs text-forest-700">Rp {b.price?.toLocaleString("id-ID")}</div></td>
                  <td className="p-3 flex flex-col gap-2">
                    <button onClick={() => handleFinishBanner(b.id)} className="bg-forest-700 text-white px-3 py-1.5 rounded text-xs hover:bg-forest-500 whitespace-nowrap font-bold">
                      ✓ Selesai & Hapus Antrean
                    </button>
                    <button onClick={() => handleRejectBanner(b.id)} className="border border-red-500 text-red-500 px-3 py-1 rounded text-xs hover:bg-red-50 whitespace-nowrap">
                      ✕ Tolak / Batal
                    </button>
                  </td>
                </tr>
              ))}
              {localPendingBanners.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-neutral-500">Tidak ada pengajuan iklan banner.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 5: KELOLA AKUN */}
      {activeTab === "users" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr><th className="p-3">Nama User</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Aksi</th></tr>
            </thead>
            <tbody>
              {localUsers.map((u) => (
                <tr key={u.id} className="border-t border-neutral-200 dark:border-neutral-800">
                  <td className="p-3 font-medium">{u.name || "-"}</td>
                  <td className="p-3">{u.email}</td>
                  <td className="p-3"><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${u.role === "SUPPLIER" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{u.role}</span></td>
                  <td className="p-3"><span className={`px-2 py-0.5 text-xs font-bold rounded-full ${u.status === "ACTIVE" ? "bg-green-100 text-green-800" : u.status === "SUSPENDED" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{u.status}</span></td>
                  <td className="p-3">
                    <button onClick={() => { setActionUser(u); setActionType(u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"); setSuspendReason(""); }} className="text-forest-700 hover:underline dark:text-lime-400 font-medium text-xs whitespace-nowrap">Ubah Status</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: KELOLA BANNER ADMIN */}
      {activeTab === "banners" && (
        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          <div className="rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 h-fit">
            <h3 className="font-bold text-lg mb-4">{editBannerId ? "Edit Banner" : "Tambah Banner Manual"}</h3>
            <form onSubmit={handleSubmitBanner} className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Gambar (16:9)</label>
                {bannerPreview ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border mb-2 group bg-black/5">
                    <img src={bannerPreview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity duration-200">
                      <button type="button" onClick={() => { setImageSrc(bannerPreview); setIsCropping(true); }} className="bg-forest-700 hover:bg-forest-500 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-md transition-colors">✂️ Sesuaikan Posisi</button>
                      <button type="button" onClick={() => { setBannerFile(null); setBannerPreview(null); }} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-md text-xs font-bold shadow-md transition-colors">🗑️ Hapus Gambar</button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <input type="file" accept="image/*" onChange={handleBannerFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg bg-neutral-50 hover:bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-700 transition-colors">
                      <span className="text-2xl mb-1">🖼️</span>
                      <span className="text-xs font-medium text-neutral-500">Klik pilih gambar (Lalu Crop)</span>
                    </div>
                  </div>
                )}
              </div>
              <div><label className="text-sm font-medium block mb-1">Judul (Opsional)</label><input value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700" /></div>
              <div><label className="text-sm font-medium block mb-1">Link (Opsional)</label><input value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700" /></div>
              
              <div>
                <label className="text-sm font-medium block mb-1">Durasi (Hari)</label>
                <input type="number" min={1} value={bannerDuration} onChange={e => setBannerDuration(Number(e.target.value))} className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700" placeholder="Contoh: 30" />
                <p className="text-xs text-neutral-500 mt-1">Banner akan otomatis berhenti tayang setelah durasi ini habis.</p>
              </div>

              <div><label className="text-sm font-medium block mb-1">Urutan Tampil</label><input type="number" value={bannerOrder} onChange={e => setBannerOrder(Number(e.target.value))} className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700" /></div>
              <div className="flex gap-2 pt-2">
                {editBannerId && <button type="button" onClick={resetFormBanner} className="flex-1 bg-neutral-200 text-neutral-700 h-10 rounded-md font-medium text-sm hover:bg-neutral-300">Batal</button>}
                <button type="submit" disabled={uploadingBanner || (!editBannerId && !bannerFile)} className="flex-1 bg-forest-700 text-white h-10 rounded-md font-medium text-sm hover:bg-forest-500 disabled:opacity-50">{uploadingBanner ? "Menyimpan..." : (editBannerId ? "Update Banner" : "Simpan Banner")}</button>
              </div>
            </form>
          </div>
          <div className="rounded-md border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h3 className="font-bold text-lg mb-4">Daftar Banner Carousel (Tayang)</h3>
            {loadingBanners ? <p className="text-sm text-neutral-500">Memuat...</p> : banners.length === 0 ? <p className="text-sm text-neutral-500">Belum ada banner.</p> : (
              <div className="space-y-3">
                {banners.filter(b => b.type === "CAROUSEL" && b.status === "APPROVED").map(b => (
                  <div key={b.id} className="flex gap-4 p-3 border border-neutral-200 dark:border-neutral-800 rounded-lg items-center hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <div className="h-16 w-28 shrink-0 rounded overflow-hidden border bg-neutral-100"><img src={b.imageUrl} alt="Banner" className="w-full h-full object-cover" /></div>
                    <div className="flex-1">
                      <p className="font-bold text-sm">{b.title || "-"}</p>
                      <p className="text-xs text-neutral-500">Urutan: {b.order}</p>
                      {b.endDate && <p className="text-xs text-red-500">Berakhir: {new Date(b.endDate).toLocaleDateString("id-ID")}</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => handleEditClick(b)} className="text-amber-500 hover:bg-amber-50 p-2 rounded-md transition-colors" title="Edit Banner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                      <button onClick={() => handleDeleteBanner(b.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-md transition-colors" title="Hapus Banner"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: LAPORAN KONSUMEN */}
      {activeTab === "reports" && (
        <div className="overflow-x-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm text-left">
            <thead className="bg-neutral-100 dark:bg-neutral-800">
              <tr>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Nama / Email</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Subjek</th>
                <th className="p-3">Pesan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {localReports.map((r) => (
                <tr key={r.id} className="border-t border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                  <td className="p-3 whitespace-nowrap">{new Date(r.createdAt).toLocaleDateString("id-ID")}</td>
                  <td className="p-3">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-neutral-500">{r.email}</div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${r.category === "PELANGGARAN" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                      {r.category}
                    </span>
                  </td>
                  <td className="p-3 font-medium">{r.subject}</td>
                  <td className="p-3">
                    <div className="max-w-[250px] whitespace-normal line-clamp-3 hover:line-clamp-none cursor-pointer text-xs" title={r.message}>
                      {r.message}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      r.status === "PENDING" ? "bg-amber-100 text-amber-800" : 
                      r.status === "RESOLVED" ? "bg-green-100 text-green-800" : 
                      "bg-neutral-200 text-neutral-700"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-col gap-2">
                      {r.status === "PENDING" ? (
                        <>
                          {replyingTo === r.id && (
                            <textarea 
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Ketik balasan..."
                              className="w-full text-xs p-2 border rounded-md min-h-[60px]"
                            />
                          )}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdateReportStatus(r.id, "RESOLVED")}
                              disabled={updatingReportId === r.id}
                              className="bg-forest-700 hover:bg-forest-500 text-white px-2.5 py-1 rounded text-xs disabled:opacity-50 whitespace-nowrap"
                            >
                              {replyingTo === r.id ? "Kirim & Selesai" : "✓ Selesai"}
                            </button>
                            
                            {replyingTo === r.id ? (
                              <button 
                                onClick={() => setReplyingTo(null)}
                                className="border border-neutral-300 text-neutral-600 hover:bg-neutral-100 px-2.5 py-1 rounded text-xs"
                              >
                                Batal
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateReportStatus(r.id, "REJECTED")}
                                disabled={updatingReportId === r.id}
                                className="border border-neutral-300 text-neutral-600 hover:bg-neutral-100 px-2.5 py-1 rounded text-xs disabled:opacity-50 whitespace-nowrap"
                              >
                                ✕ Tolak
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col gap-1 mb-2">
                          <span className="text-xs text-neutral-400 italic">Sudah ditangani</span>
                          {r.adminReply && (
                            <span className="text-[10px] text-forest-700 bg-forest-50 p-1 rounded">Balasan: {r.adminReply}</span>
                          )}
                        </div>
                      )}
                      
                      <button
                        onClick={() => handleDeleteReport(r.id)}
                        className="text-xs text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded whitespace-nowrap w-fit transition-colors"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {localReports.length === 0 && (
                <tr><td colSpan={7} className="p-4 text-center text-neutral-500">Belum ada laporan masuk.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL CROP GAMBAR BANNER */}
      {/* ======================================================== */}
      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl overflow-hidden w-full max-w-3xl flex flex-col shadow-2xl">
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">Sesuaikan Posisi Banner (16:9)</h3>
            </div>
            <div className="relative w-full h-[400px] bg-neutral-800">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onCropComplete={(_, croppedPixels) => setCroppedAreaPixels(croppedPixels)} onZoomChange={setZoom} />
            </div>
            <div className="p-4 space-y-4">
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-forest-700" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => { setIsCropping(false); setImageSrc(null); }} className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-md">Batal</button>
                <button type="button" onClick={handleSaveCrop} className="px-6 py-2 text-sm font-bold text-white bg-forest-700 rounded-md">Terapkan & Simpan</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REVIEW VERIFIKASI PERUSAHAAN */}
      {reviewCompany && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="bg-white dark:bg-neutral-950 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden border border-neutral-200 dark:border-neutral-800">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <div><h3 className="font-display font-bold text-xl text-forest-900 dark:text-white">Review Verifikasi: {reviewCompany.name}</h3></div>
              <button onClick={() => setReviewCompany(null)} className="text-neutral-400 hover:text-red-500 transition-colors p-2"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
              <div className="lg:w-1/3 bg-neutral-50 dark:bg-neutral-900/30 p-6 border-b lg:border-b-0 lg:border-r border-neutral-200 dark:border-neutral-800">
                <h4 className="font-bold text-sm text-neutral-500 uppercase tracking-wider mb-4">Informasi Perusahaan</h4>
                <div className="space-y-4 text-sm">
                  <div><p className="text-xs text-neutral-500 mb-1">Nama Perusahaan</p><p className="font-bold text-neutral-900 dark:text-white text-lg">{reviewCompany.name}</p></div>
                  <div><p className="text-xs text-neutral-500 mb-1">Tipe Bisnis</p><p className="font-medium">{reviewCompany.type}</p></div>
                  <div><p className="text-xs text-neutral-500 mb-1">Lokasi</p><p className="font-medium">{reviewCompany.city || "-"}, {reviewCompany.province || "-"}</p></div>
                </div>
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl"><p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-medium">⚠️ Pastikan nama pada dokumen (KTP/NIB) sesuai dengan nama perusahaan di atas sebelum menyetujui.</p></div>
              </div>
              <div className="lg:w-2/3 p-6 bg-white dark:bg-neutral-950">
                <h4 className="font-bold text-lg text-neutral-900 dark:text-white mb-6 border-b pb-2">Dokumen Persyaratan</h4>
                {reviewCompany.verificationRequests?.[0]?.documentData ? (
                  <div className="space-y-3">
                    {reviewCompany.verificationRequests[0].documentData.map((doc: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm hover:border-forest-700 transition-colors">
                        <div className="flex-1"><h5 className="font-bold text-sm text-forest-900 dark:text-lime-400">{doc.label}</h5></div>
                        <div className="flex flex-wrap gap-3">
                          {doc.files.map((file: any, j: number) => (
                            <div key={j} className="relative h-16 w-24 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-50 group cursor-pointer">
                              {file.isPdf ? (
                                <a href={file.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center h-full w-full hover:bg-red-50 transition-colors"><span className="text-red-500 font-bold text-sm">PDF</span><span className="text-[9px] text-neutral-500">Buka File</span></a>
                              ) : (
                                <><img src={file.url} alt={doc.label} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" onClick={() => setSelectedDocImage(file.url)} /><div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none"><svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg></div></>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 bg-neutral-50 dark:bg-neutral-900/30 border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl text-center"><p className="font-bold text-neutral-500 mb-2">Data Dokumen Tidak Ditemukan</p><p className="text-xs text-neutral-400">Pengajuan lama (sebelum pembaruan sistem).</p></div>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="w-full sm:w-1/2"><input type="text" placeholder="Alasan penolakan (wajib diisi jika menolak)..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full h-11 rounded-lg border-neutral-300 border px-4 text-sm focus:ring-2 focus:ring-forest-700 focus:border-forest-700 transition-all dark:bg-neutral-900 dark:border-neutral-700" /></div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={() => handleVerify("reject")} disabled={processing} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors">Tolak</button>
                <button onClick={() => handleVerify("approve")} disabled={processing} className="flex-1 sm:flex-none px-6 py-2.5 text-sm font-bold text-white bg-forest-700 hover:bg-forest-500 rounded-lg transition-colors shadow-md">{processing ? "Memproses..." : "Setujui Verifikasi"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUSPEND/BAN USER */}
      {actionUser && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-2xl p-6 w-full max-w-md border border-neutral-200 dark:border-neutral-800">
            <h3 className="font-bold text-xl mb-4">Ubah Status Akun</h3>
            <p className="text-sm text-neutral-500 mb-4">User: <strong>{actionUser.email}</strong></p>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium block mb-1">Pilih Status</label>
                <select value={actionType} onChange={(e) => setActionType(e.target.value as any)} className="w-full h-10 rounded-md border px-3 text-sm dark:bg-neutral-800 dark:border-neutral-700">
                  <option value="ACTIVE">Aktifkan Kembali (ACTIVE)</option>
                  <option value="SUSPENDED">Skorsing Sementara (SUSPENDED)</option>
                  <option value="BANNED">Blokir Permanen (BANNED)</option>
                </select>
              </div>
              {actionType !== "ACTIVE" && (
                <div>
                  <label className="text-sm font-medium block mb-1">Alasan (Wajib)</label>
                  <textarea value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} rows={3} placeholder="Contoh: Terbukti melakukan penipuan..." className="w-full rounded-md border p-3 text-sm dark:bg-neutral-800 dark:border-neutral-700" />
                  <p className="text-xs text-red-500 mt-1">*Alasan ini akan muncul di layar login user.</p>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-6">
                <button type="button" onClick={() => setActionUser(null)} className="px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 rounded-md">Batal</button>
                <button type="button" onClick={handleUpdateStatus} disabled={savingUser} className={`px-4 py-2 text-sm font-medium text-white rounded-md disabled:opacity-50 ${actionType === "ACTIVE" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}>{savingUser ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX ZOOM GAMBAR */}
      {selectedDocImage && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 p-4 backdrop-blur-sm" onClick={() => setSelectedDocImage(null)}>
          <div className="relative max-w-5xl max-h-[95vh]">
            <img src={selectedDocImage} alt="Zoom" className="max-w-full max-h-[95vh] object-contain rounded-md" />
            <button onClick={(e) => { e.stopPropagation(); setSelectedDocImage(null); }} className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold transition-colors">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}