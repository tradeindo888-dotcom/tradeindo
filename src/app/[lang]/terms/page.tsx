import Link from "next/link";

export default function TermsPage({ params }: { params: { lang: string } }) {
  const lang = params.lang === "en" ? "en" : "id";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold mb-2 text-forest-900 dark:text-white">
          {lang === "en" ? "Terms and Conditions" : "Syarat dan Ketentuan"}
        </h1>
      </div>

      <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 space-y-6">
        <p>
          Syarat dan Ketentuan ("Ketentuan") ini mengatur penggunaan Anda atas situs web, aplikasi, dan layanan yang disediakan oleh TRADE INDO ("Platform"). Dengan mendaftar, mengakses, atau menggunakan layanan Kami, Anda ("Pengguna") menyatakan telah membaca, memahami, dan menyetujui untuk terikat dengan seluruh Ketentuan ini.
        </p>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 1: DEFINISI</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Platform</strong> adalah sistem elektronik TRADE INDO yang mempertemukan Buyer (Pembeli) dan Supplier (Pemasok).</li>
            <li><strong>Buyer</strong> adalah Pengguna yang mendaftar dengan tipe perusahaan BUYER untuk mencari produk dan mengajukan RFQ (Request for Quotation).</li>
            <li><strong>Supplier</strong> adalah Pengguna yang mendaftar dengan tipe perusahaan MANUFACTURER, DISTRIBUTOR, atau EXPORTER untuk menawarkan produk.</li>
            <li><strong>RFQ</strong> adalah permintaan penawaran harga yang diajukan oleh Buyer kepada Supplier.</li>
            <li><strong>Sponsorship</strong> adalah layanan berbayar untuk meningkatkan visibilitas produk tertentu di Platform.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 2: PERAN DAN BATASAN PLATFORM</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Platform hanya berfungsi sebagai penyedia wadah (Intermediary/Directory).</strong> Kami menyediakan sistem untuk mempertemukan Buyer dan Supplier, serta memfasilitasi komunikasi (Chat) dan penawaran (Quotation).</li>
            <li><strong>Kami BUKAN pihak dalam transaksi.</strong> Segala bentuk kesepakatan jual-beli, pembayaran, pengiriman barang, pajak, dan bea cukai adalah <strong>tanggung jawab sepenuhnya</strong> antara Buyer dan Supplier.</li>
            <li><strong>Transaksi di Luar Platform:</strong> Kami tidak memfasilitasi pembayaran (Escrow/Payment Gateway) di dalam Platform. Segala bentuk transfer dana yang dilakukan Buyer ke Supplier dilakukan di luar sistem Kami dan sepenuhnya menjadi risiko Pengguna.</li>
            <li>Kami <strong>tidak bertanggung jawab</strong> atas kerugian, penipuan, wanprestasi, atau cacat barang yang timbul dari transaksi yang dilakukan antar Pengguna.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 3: KEWAJIBAN PENGGUNA</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Kebenaran Data:</strong> Pengguna wajib memberikan informasi yang akurat, benar, dan terbaru saat mendaftar.</li>
            <li><strong>Keamanan Akun:</strong> Pengguna bertanggung jawab penuh untuk menjaga kerahasiaan kata sandi (password) akun masing-masing.</li>
            <li><strong>Larangan Konten:</strong> Pengguna dilarang mengunggah produk yang bersifat ilegal, melanggar hak kekayaan intelektual, mengandung unsur SARA, atau barang yang dilarang oleh hukum Indonesia.</li>
            <li><strong>Kebijakan Verifikasi:</strong> Supplier yang mengajukan verifikasi (Verified) wajib melampirkan dokumen perusahaan yang sah. Pemalsuan dokumen akan mengakibatkan pemblokiran akun secara permanen.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 4: KETENTUAN LAYANAN (SUBSCRIPTION PLANS)</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Paket Berlangganan:</strong> Platform menyediakan paket FREE, PRO, dan PREMIUM dengan batasan fitur yang berbeda-beda sesuai yang tertera di halaman Pricing.</li>
            <li><strong>Pembayaran Langganan:</strong> Pembayaran dilakukan melalui transfer bank manual. Akun akan di-upgrade setelah Admin memverifikasi bukti pembayaran.</li>
            <li><strong>Masa Tenggang (Grace Period):</strong> Jika masa aktif paket berakhir, Pengguna akan diberikan masa tenggang. Jika tidak diperpanjang, sistem akan otomatis menurunkan paket ke FREE.</li>
            <li><strong>Pengembalian Dana:</strong> Biaya langganan yang sudah dibayarkan dan disetujui oleh Admin <strong>tidak dapat dikembalikan</strong> (Non-Refundable), kecuali terdapat kesalahan sistem yang terbukti dari pihak Kami.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 5: KETENTUAN SPONSORSHIP & IKLAN</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li><strong>Pengajuan Sponsorship:</strong> Pengguna dapat mengajukan Sponsorship dengan mengunggah bukti transfer sesuai harga yang tertera.</li>
            <li><strong>Persetujuan Admin:</strong> Pengajuan Sponsorship bersifat Pending sampai disetujui oleh Admin.</li>
            <li><strong>Masa Aktif:</strong> Masa aktif Sponsorship dihitung sejak Admin menyetujui pengajuan (APPROVED), bukan sejak tanggal transfer.</li>
            <li><strong>Jaminan Metrik:</strong> Kami berupaya maksimal menampilkan produk yang di-sponsor, namun Kami <strong>tidak menjamin</strong> jumlah Impressions, Clicks, atau Chats tertentu, karena hal tersebut bergantung pada perilaku pasar.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 6: HAK KEKAYAAN INTELEKTUAL</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Seluruh desain, logo, kode sumber, dan tampilan Platform adalah milik Kami dan dilindungi oleh hukum.</li>
            <li>Pengguna tetap memiliki hak atas foto dan deskripsi produk yang diunggah, namun memberikan Kami lisensi bebas royalti untuk menampilkannya di Platform.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 7: PENGHENTIAN AKUN (SUSPEND & BANNED)</h2>
          <p className="mb-2">Kami berhak untuk menangguhkan atau menghapus akun Pengguna secara sepihak tanpa pemberitahuan sebelumnya, jika:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Pengguna terbukti melakukan penipuan terhadap Pengguna lain.</li>
            <li>Pengguna melanggar hukum yang berlaku di Indonesia.</li>
            <li>Pengguna menyalahgunakan sistem (misal: menggunakan bot untuk me-refresh tracking analytics).</li>
            <li>Pengguna terbukti memalsukan data verifikasi perusahaan.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 8: PEMBATASAN TANGGUNG JAWAB (LIMITATION OF LIABILITY)</h2>
          <p className="mb-2">Platform disediakan "sebagaimana adanya" (as-is). Kami tidak menjamin bahwa Platform akan bebas dari kesalahan (error) atau gangguan teknis. Kami tidak bertanggung jawab atas kerugian tidak langsung, kehilangan keuntungan, atau kerugian bisnis yang dialami Pengguna akibat dari:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Kegagalan server atau pemeliharaan sistem.</li>
            <li>Tindakan penipuan yang dilakukan oleh sesama Pengguna di luar sistem Kami.</li>
            <li>Peretasan yang disebabkan oleh kelalaian Pengguna dalam menjaga kata sandi.</li>
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-forest-900 dark:text-white mt-8 mb-3">PASAL 9: HUKUM YANG BERLAKU DAN PENYELESAIAN SENGKETA</h2>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Ketentuan ini tunduk pada hukum Negara Kesatuan Republik Indonesia.</li>
            <li>Segala perselisihan yang timbul antara Pengguna dengan Pengguna lain diselesaikan secara kekeluargaan oleh para pihak yang bersangkutan.</li>
          </ol>
        </div>

        <div className="mt-12 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-center text-sm font-medium">
          Dengan menekan tombol "Daftar" atau menggunakan layanan TRADE INDO, Anda menyatakan tunduk dan patuh pada seluruh Syarat & Ketentuan di atas.
        </div>
      </div>
    </div>
  );
}