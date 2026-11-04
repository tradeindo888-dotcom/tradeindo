  async function handleUpdateReportStatus(id: string, newStatus: "RESOLVED" | "REJECTED") {
    if (replyingTo !== id) { setReplyingTo(id); setReplyText(""); return; }
    setUpdatingReportId(id);
    try {
      const res = await fetch(`/api/admin/consumer-reports`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: newStatus, adminReply: replyText }) });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Gagal update");
      
      // UBAH TEKS NOTIFIKASI DI SINI
      toast.success(newStatus === "RESOLVED" ? "Laporan Selesai. Pesan berhasil dikirim ke Inbox pelapor." : "Laporan Ditolak. Pesan berhasil dikirim ke Inbox pelapor.");
      
      setLocalReports(prev => prev.map(r => r.id === id ? { ...r, status: newStatus, adminReply: replyText } : r));
      setReplyingTo(null); setReplyText("");
    } catch (err: any) { 
      toast.error(err.message || "Gagal memperbarui status."); 
    } finally { 
      setUpdatingReportId(null); 
    }
  }