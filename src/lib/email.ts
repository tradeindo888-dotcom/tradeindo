import nodemailer from 'nodemailer';

// ============================================================
// KONFIGURASI UTAMA BREVO (JANGAN DIHAPUS)
// ============================================================
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASSWORD,
  },
});

const senderEmail = process.env.BREVO_SENDER_EMAIL || 'tradeindo888@gmail.com';

// ============================================================
// 1. EMAIL VERIFIKASI AKUN (Saat Register)
// ============================================================
export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verifyLink = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`;
  try {
    await transporter.sendMail({
      from: `"Trade Indo" <${senderEmail}>`,
      to: email,
      subject: 'Verifikasi Email Anda - Trade Indo',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Halo ${name},</h2>
          <p>Terima kasih telah mendaftar di Trade Indo.</p>
          <p>Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; background-color: #14532D; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 16px 0;">Verifikasi Email</a>
          <p><em>Link ini akan kedaluwarsa dalam 24 jam.</em></p>
        </div>
      `,
    });
    console.log(`[sendVerificationEmail] ✅ Terkirim ke ${email}`);
    return true;
  } catch (error) {
    console.error("[sendVerificationEmail] ❌ Error:", error);
    return false;
  }
}

// ============================================================
// 2. EMAIL BALASAN LAPORAN KONSUMEN
// ============================================================
export async function sendReportResponseEmail(email: string, name: string, subject: string, reply: string, status: string) {
  const statusText = status === "RESOLVED" ? "Selesai Ditangani" : "Ditolak";
  const statusColor = status === "RESOLVED" ? "#14532D" : "#dc2626";
  try {
    await transporter.sendMail({
      from: `"Trade Indo" <${senderEmail}>`,
      to: email,
      subject: `[Layanan Konsumen] Tanggapan untuk Laporan: ${subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Halo ${name},</h2>
          <p>Laporan Anda dengan subjek <strong>"${subject}"</strong> telah kami tinjau.</p>
          <div style="margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-left: 4px solid ${statusColor};">
            <p style="margin: 0; font-weight: bold; color: ${statusColor};">Status: ${statusText}</p>
            <p style="margin: 10px 0 0 0; color: #374151;">${reply}</p>
          </div>
          <p>Salam,<br>Tim Trade Indo</p>
        </div>
      `,
    });
    console.log(`[sendReportResponseEmail] ✅ Terkirim ke ${email}`);
    return true;
  } catch (error) {
    console.error("[sendReportResponseEmail] ❌ Error:", error);
    return false;
  }
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
  try {
    console.log(`[sendWinnerEmail] Mencoba kirim ke ${email}...`);
    await transporter.sendMail({
      from: `"Trade Indo" <${senderEmail}>`,
      to: email,
      subject: `🏆 Selamat! Penawaran Anda Diterima - ${rfqTitle}`,
      html: `
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
      `,
    });
    console.log(`[sendWinnerEmail] ✅ Terkirim ke ${email}`);
    return true;
  } catch (error) {
    console.error("[sendWinnerEmail] ❌ Error:", error);
    return false;
  }
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
  try {
    console.log(`[sendLoserEmail] Mencoba kirim ke ${email}...`);
    await transporter.sendMail({
      from: `"Trade Indo" <${senderEmail}>`,
      to: email,
      subject: `Hasil Penawaran - ${rfqTitle}`,
      html: `
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
      `,
    });
    console.log(`[sendLoserEmail] ✅ Terkirim ke ${email}`);
    return true;
  } catch (error) {
    console.error("[sendLoserEmail] ❌ Error:", error);
    return false;
  }
}