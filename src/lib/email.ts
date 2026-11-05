// src/lib/email.ts

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'tradeindo888@gmail.com';
const SENDER_NAME = 'Trade Indo';

// ============================================================
// FUNGSI HELPER: Mengirim Email via Brevo HTTP API
// ============================================================
async function sendBrevoEmail(to: { email: string; name: string }, subject: string, htmlContent: string) {
  if (!BREVO_API_KEY) {
    console.error("[Brevo API] BREVO_API_KEY tidak ditemukan di environment variables.");
    return false;
  }

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [to],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error(`[Brevo API] ❌ Gagal mengirim email ke ${to.email}:`, response.status, errorBody);
      return false;
    }

    console.log(`[Brevo API] ✅ Email terkirim ke ${to.email}`);
    return true;
  } catch (error) {
    console.error(`[Brevo API] ❌ Error jaringan saat mengirim email ke ${to.email}:`, error);
    return false;
  }
}

// ============================================================
// 1. EMAIL VERIFIKASI AKUN (Saat Register)
// ============================================================
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Halo ${name},</h2>
      <p>Terima kasih telah mendaftar di Trade Indo.</p>
      <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
      <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #14532D; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verifikasi Email</a>
      <p><em>Link ini akan kedaluwarsa dalam 24 jam.</em></p>
    </div>
  `;
  return sendBrevoEmail({ email, name }, 'Verifikasi Email Anda - Trade Indo', html);
}

// ============================================================
// 2. EMAIL BALASAN LAPORAN KONSUMEN
// ============================================================
export async function sendReportResponseEmail(email: string, name: string, subject: string, reply: string, status: string) {
  const statusText = status === "RESOLVED" ? "Selesai Ditangani" : "Ditolak";
  const statusColor = status === "RESOLVED" ? "#14532D" : "#dc2626";
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Halo ${name},</h2>
      <p>Laporan Anda dengan subjek <strong>"${subject}"</strong> telah kami tinjau.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid ${statusColor};">
        <p style="margin: 0; font-weight: bold; color: ${statusColor};">Status: ${statusText}</p>
        <p style="margin: 10px 0 0 0; color: #374151;">${reply}</p>
      </div>
      <p>Salam,<br>Tim Trade Indo</p>
    </div>
  `;
  return sendBrevoEmail({ email, name }, `[Layanan Konsumen] Tanggapan untuk Laporan: ${subject}`, html);
}

// ============================================================
// 3. EMAIL PEMENANG LELANG RFQ
// ============================================================
export async function sendWinnerEmail(
  email: string,
  name: string,
  rfqTitle: string,
  unitPrice: number,
  totalPrice: number,
  rfqId: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/id/rfqs/${rfqId}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #14532D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <div style="font-size: 48px;">🏆</div>
        <h1 style="margin: 10px 0;">Selamat ${name}!</h1>
        <p style="margin: 0; opacity: 0.9;">Penawaran Anda DITERIMA</p>
      </div>
      <div style="padding: 30px; background: white; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
        <p>Penawaran Anda untuk RFQ <strong>"${rfqTitle}"</strong> telah <strong style="color: #14532D;">DITERIMA</strong> oleh buyer.</p>
        <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; color: #14532D; font-size: 18px; font-weight: bold;">🏆 ANDA PEMENANG!</p>
          <p style="margin: 10px 0 0 0;">Harga Disetujui: <strong>Rp ${unitPrice.toLocaleString("id-ID")}</strong></p>
          <p style="margin: 5px 0 0 0;">Total: <strong>Rp ${totalPrice.toLocaleString("id-ID")}</strong></p>
        </div>
        <h3>Langkah Selanjutnya:</h3>
        <ol>
          <li>Buka halaman RFQ</li>
          <li>Hubungi buyer via chat untuk konfirmasi PO, pembayaran, pengiriman</li>
        </ol>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="display: inline-block; padding: 14px 32px; background-color: #14532D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            💬 Buka RFQ & Hubungi Buyer
          </a>
        </div>
      </div>
    </div>
  `;
  return sendBrevoEmail({ email, name }, `🏆 Selamat! Penawaran Anda Diterima - ${rfqTitle}`, html);
}

// ============================================================
// 4. EMAIL PESERTA YANG KALAH
// ============================================================
export async function sendLoserEmail(
  email: string,
  name: string,
  rfqTitle: string,
  rfqId: string
) {
  const link = `${process.env.NEXT_PUBLIC_APP_URL}/id/rfqs/${rfqId}`;
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Halo ${name},</h2>
      <p>Terima kasih telah mengirim penawaran untuk RFQ <strong>"${rfqTitle}"</strong>.</p>
      <p>Buyer telah memilih supplier lain untuk RFQ ini.</p>
      <div style="margin: 20px 0; padding: 15px; background-color: #fef3c7; border-left: 4px solid #f59e0b;">
        <p style="margin: 0; color: #92400e;">Jangan berkecil hati! Masih banyak RFQ aktif menunggu penawaran terbaik Anda.</p>
      </div>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="display: inline-block; padding: 14px 32px; background-color: #14532D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
          Lihat Hasil Penawaran
        </a>
      </div>
    </div>
  `;
  return sendBrevoEmail({ email, name }, `Hasil Penawaran - ${rfqTitle}`, html);
}

// ============================================================
// 5. EMAIL RESET PASSWORD
// ============================================================
export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  // Pastikan NEXT_PUBLIC_APP_URL diisi di .env / Render Dashboard
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/id/reset-password?token=${token}`;
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
      <div style="background: #14532D; padding: 20px; text-align: center;">
        <h2 style="color: white; margin: 0;">Trade Indo</h2>
      </div>
      <div style="padding: 30px;">
        <h3>Halo ${name || "Pengguna"},</h3>
        <p>Kami menerima permintaan untuk mereset password akun Trade Indo Anda.</p>
        <p>Silakan klik tombol di bawah ini untuk membuat password baru:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background-color: #14532D; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">
            Reset Password
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px;"><em>Link ini hanya berlaku selama 1 jam. Jika Anda tidak merasa meminta reset password, abaikan saja email ini dan password Anda tidak akan berubah.</em></p>
      </div>
    </div>
  `;
  return sendBrevoEmail({ email, name }, 'Reset Password Akun Trade Indo', html);
}