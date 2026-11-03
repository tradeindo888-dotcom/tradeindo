export const dict = {
  id: {
    searchPlaceholder: "Cari produk, supplier, atau peluang bisnis...",
    products: "Produk",
    suppliers: "Supplier",
    rfq: "RFQ",
    workspace: "Workspace",
    adminPanel: "Admin Panel",
    logout: "Keluar",
    login: "Masuk",
    register: "Daftar",
    heroTitle: "Temukan Supplier, Produk, dan Peluang Bisnis di Satu Platform.",
    heroSubtitle: "Dari supplier lokal ke pasar global.",
    searchBtn: "Cari",
    featuredCategories: "Kategori Unggulan",
    featuredProducts: "Produk Pilihan",
    createRfq: "Buat RFQ",
  },
  en: {
    searchPlaceholder: "Search products, suppliers, or business opportunities...",
    products: "Products",
    suppliers: "Suppliers",
    rfq: "RFQ",
    workspace: "Workspace",
    adminPanel: "Admin Panel",
    logout: "Sign Out",
    login: "Sign In",
    register: "Register",
    heroTitle: "Find Suppliers, Products, and Business Opportunities in One Platform.",
    heroSubtitle: "From local suppliers to global markets.",
    searchBtn: "Search",
    featuredCategories: "Featured Categories",
    featuredProducts: "Featured Products",
    createRfq: "Create RFQ",
  }
} as const;

export type Locale = keyof typeof dict;
export type Dictionary = typeof dict.id;