// Pemetaan kata kunci per kategori (Indonesia + Inggris)
// Urutan kategori menentukan prioritas: yang lebih spesifik diletakkan lebih dulu
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  otomotif: [
    // Kendaraan
    "ban", "tire", "tayar", "roda", "wheel", "motor", "motorcycle",
    "mobil", "car", "truk", "truck", "bus", "pickup", "sedan", "mpv", "suv",
    // Suku cadang
    "sparepart", "spare part", "suku cadang", "oli", "pelumas", "lubricant",
    "busi", "spark plug", "aki", "battery", "knalpot", "exhaust",
    "rem", "brake", "kopling", "clutch", "shockbreaker", "suspension",
    "karburator", "carburetor", "injektor", "injector", "radiator",
    "filter oli", "filter udara", "kampas rem", "bearing roda",
    // Aksesoris
    "helm", "helmet", "kaca mobil", "spion", "lampu mobil", "jok mobil",
    // Merek
    "bridgestone", "michelin", "dunlop", "yokohama", "gt radial",
    "honda", "yamaha", "suzuki", "kawasaki", "toyota", "daihatsu",
  ],
  
  "peralatan-medis": [
    "medis", "medical", "kesehatan", "health", "rumah sakit", "hospital",
    "klinik", "clinic", "dokter", "doctor", "perawat", "nurse",
    "masker", "mask", "sarung tangan medis", "handscoon",
    "plester", "bandage", "perban", "jarum suntik", "syringe", "infus",
    "stetoskop", "stethoscope", "tensimeter", "sphygmomanometer",
    "termometer", "thermometer", "kursi roda", "wheelchair",
    "tempat tidur pasien", "bed pasien", "tabung oksigen", "oksigen",
    "obat", "medicine", "vitamin", "suplemen", "supplement",
    "alkohol medis", "antiseptik", "antiseptic", "kapas", "cotton",
    "kassa", "gauze", "apotek", "pharmacy",
  ],
  
  kimia: [
    "kimia", "chemical", "asam", "acid", "basa", "alkali",
    "pelarut", "solvent", "senyawa", "compound", "formula", "reagen", "reagent",
    "katalis", "catalyst", "polimer", "polymer", "resin",
    "pigmen", "pigment", "pewarna", "dye", "tinta", "ink",
    "detergen", "detergent", "sabun", "soap", "shampoo",
    "pembersih", "cleaner", "desinfektan", "disinfectant",
    "alkohol", "alcohol", "aseton", "acetone", "amonia", "ammonia",
    "formalin", "formaldehyde", "gliserin", "glycerin",
    "asam sulfat", "sulfuric", "asam klorida", "hydrochloric",
    "natrium", "sodium", "kalium", "potassium", "kalsium", "calcium",
  ],
  
  "peralatan-elektronik": [
    "elektronik", "electronic", "listrik", "electric",
    "lampu", "lamp", "led", "bohlam", "bulb", "neon",
    "kabel", "cable", "saklar", "switch", "stopkontak", "socket",
    "adaptor", "adapter", "charger", "power bank", "inverter",
    "stabilizer", "ups", "trafo", "transformer",
    "tv", "televisi", "monitor", "komputer", "computer", "laptop",
    "hp", "handphone", "smartphone", "tablet",
    "kamera", "camera", "speaker", "headphone", "earphone",
    "microwave", "kulkas", "refrigerator", "ac", "air conditioner",
    "kipas", "fan", "setrika", "iron", "blender", "rice cooker",
    "dispenser", "mesin cuci", "washing machine", "vacuum cleaner",
  ],
  
  "material-bangunan": [
    "material", "bangunan", "building", "konstruksi", "construction",
    "semen", "cement", "pasir", "sand", "batu", "stone", "bata", "brick",
    "beton", "concrete", "besi beton", "rebar", "baja ringan",
    "kayu balok", "kayu papan", "plywood", "triplek",
    "gypsum", "cat tembok", "cat kayu", "paint",
    "keramik", "tile", "ubin", "granit", "marmer", "marble",
    "genteng", "roof tile", "atap", "roofing", "seng",
    "pipa", "pipe", "pipa pvc", "pipa besi",
    "kaca", "glass", "aluminium", "aluminum",
    "paku", "nail", "sekrup", "screw", "baut", "bolt",
    "lem", "glue", "sealant", "waterproofing",
  ],
  
  "mineral-metal": [
    "mineral", "tambang", "mining", "emas", "gold",
    "perak", "silver", "tembaga", "copper", "besi tua", "scrap",
    "aluminium ingot", "timah", "tin", "nikel", "nickel",
    "seng", "zinc", "bijih", "ore", "batubara", "coal", "batu bara",
    "pasir besi", "iron sand", "ingot", "ferro", "ferroalloy",
    "baja", "steel", "billet", "slab", "wire rod",
  ],
  
  "perlengkapan-rumah": [
    "perlengkapan rumah", "rumah tangga", "household",
    "dapur", "kitchen", "piring", "plate", "gelas", "mangkok", "bowl",
    "sendok", "spoon", "garpu", "fork", "pisau dapur", "knife",
    "panci", "pot", "wajan", "pan", "ember", "bucket",
    "sapu", "broom", "pel", "mop", "pengki",
    "tempat sampah", "trash", "jemuran", "hanger", "rak piring",
    "lampu hias", "vas", "vase", "bantal", "pillow", "guling",
    "selimut", "blanket", "karpet", "carpet", "tirai",
    "gantungan baju", "jemuran", "setrika",
  ],
  
  kemasan: [
    "kemasan", "packaging", "kertas", "paper", "kardus", "cardboard",
    "box", "kotak", "plastik", "plastic", "botol", "bottle",
    "toples", "jar", "kaleng", "can", "pouch", "sachet",
    "wrap", "wrapping", "bubble wrap", "foil", "aluminum foil",
    "label", "sticker", "stiker", "pita", "ribbon", "tali", "rope",
    "selotip", "tape", "lakban", "kantong", "bag", "kresek",
    "paper bag", "corrugated", "standing pouch", "plastik opp",
  ],
  
  "makanan-olahan": [
    "makanan", "food", "keripik", "chips", "biskuit", "biscuit",
    "roti", "bread", "kue", "cake", "snack", "camilan",
    "saus", "sauce", "sambal", "mie", "noodle", "pasta",
    "gula", "sugar", "garam", "salt", "minyak goreng", "cooking oil",
    "madu", "honey", "selai", "jam", "sirup", "syrup",
    "kecap", "soy sauce", "susu", "milk", "keju", "cheese",
    "yogurt", "mentega", "butter", "kalengan", "canned",
    "frozen food", "beku", "instan", "instant",
    "bumbu", "spice", "rempah", "herb", 
    // KATA OLAHAN KOPI/TEH (DIPINDAHKAN DARI PERTANIAN)
    "kopi bubuk", "kopi instan", "kopi sachet", "kopi susu", "coffee", "cold brew", "roasted", "concentrate",
    "teh celup", "teh tubruk", "teh instan"
  ],
  
  pertanian: [
    "pertanian", "agriculture", "perkebunan", "plantation",
    "beras", "rice",
    "jagung", "corn", "sayur", "vegetable", "buah", "fruit",
    "cabai", "chili", "bawang", "onion", "kentang", "potato",
    "kedelai", "soybean", "kacang", "peanut", "kelapa", "coconut",
    "sawit", "palm", "karet", "rubber", "cengkeh", "clove",
    "lada", "pepper", "vanila", "vanilla", "kakao", "cocoa",
    "bibit", "seed", "pupuk", "fertilizer", "panen", "harvest",
    "petani", "farmer", "green bean", 
    // HANYA KATA MENTAH UNTUK KOPI/TEH
    "biji kopi", "kopi mentah", "kopi arabika", "kopi robusta", "coffee bean raw", "teh mentah", "daun teh"
  ],
  
  furnitur: [
    "furniture", "furnitur", "meja", "table", "kursi", "chair",
    "lemari", "cabinet", "sofa", "rak", "shelf", "tempat tidur", "bed",
    "kasur", "mattress", "almari", "wardrobe", "bangku", "bench",
    "laci", "drawer", "meja makan", "meja kerja", "kursi tamu",
    "kayu jati", "teak", "mahoni", "mahogany", "rotan", "rattan",
    "furnitur kayu", "furnitur rotan", "furnitur besi",
  ],
  
  tekstil: [
    "tekstil", "textile", "kain", "fabric", "benang", "yarn",
    "serat", "fiber", "katun", "cotton", "sutra", "silk",
    "wol", "wool", "linen", "poliester", "polyester",
    "nilon", "nylon", "rayon", "tenun", "weaving",
    "batik", "songket", "ulos", "sarung", "kain tenun",
    "sprei", "bedcover", "handuk", "towel", "selimut tekstil",
    "gorden", "curtain",
  ],
  
  kerajinan: [
    "kerajinan", "craft", "handmade", "souvenir",
    "ukiran", "carving", "patung", "statue", "anyaman", "woven",
    "bambu", "bamboo", "kayu ukir", "topeng", "mask",
    "wayang", "batik tulis", "gerabah", "pottery",
    "keramik seni", "ceramic", "perak", "silver",
    "kuningan", "brass", "aksesoris kerajinan",
    "hiasan", "ornament", "vas seni", "dompet kulit", "tas kulit",
  ],
  
  "pakaian-mode": [
    "pakaian", "clothing", "baju", "shirt", "kaos", "t-shirt",
    "kemeja", "dress", "gaun", "celana", "pants", "rok", "skirt",
    "jaket", "jacket", "sweater", "hoodie", "sepatu", "shoes",
    "sandal", "slippers", "tas", "bag", "topi", "hat",
    "ikat pinggang", "belt", "jilbab", "hijab", "mukena",
    "koko", "kebaya", "mode", "fashion", "butik", "boutique",
    "kemeja batik", "gamis", "seragam",
  ],

  mesin: [
    "mesin", "machine", "motor listrik", "electric motor", "generator", "genset",
    "pompa", "pump", "kompresor", "compressor", "blower",
    "conveyor", "ban berjalan", "mesin produksi", "production machine",
    "mesin pertanian", "agricultural machine", "traktor", "tractor",
    "mesin jahit", "sewing machine", "mesin potong", "cutting machine",
    "mesin pengemas", "packaging machine", "mesin cetak", "printing machine",
    "cnc", "bubut", "lathe", "frais", "milling", "bor", "drill",
    "gerinda", "grinder", "las", "welding", "pemotong", "cutter",
    "hidrolik", "hydraulic", "pneumatik", "pneumatic",
    "bearing", "gear", "roda gigi", "belt", "pulley", "rantai", "chain",
  ]
};

// Nama kategori untuk tampilan
export const CATEGORY_NAMES: Record<string, string> = {
  pertanian: "Pertanian & Perkebunan",
  "makanan-olahan": "Makanan Olahan",
  furnitur: "Furnitur",
  tekstil: "Tekstil",
  kerajinan: "Kerajinan",
  "pakaian-mode": "Pakaian & Mode",
  kimia: "Kimia",
  mesin: "Mesin",
  otomotif: "Otomotif",
  "peralatan-elektronik": "Peralatan Elektronik",
  "material-bangunan": "Material Bangunan",
  "peralatan-medis": "Peralatan Medis",
  "perlengkapan-rumah": "Perlengkapan Rumah",
  "mineral-metal": "Mineral & Metal",
  kemasan: "Kemasan",
};

// Fungsi: cari kategori yang cocok dengan judul
export function suggestCategoryFromTitle(title: string): {
  suggestedSlug: string | null;
  matchedKeyword: string | null;
  allMatches: string[];
} {
  if (!title || title.trim().length < 3) {
    return { suggestedSlug: null, matchedKeyword: null, allMatches: [] };
  }

  const lowerTitle = title.toLowerCase().trim();
  const allMatches: { slug: string; keyword: string }[] = [];

  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Gunakan word boundary untuk hindari false positive
      // (misal "bandung" tidak akan match "ban")
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escaped}\\b`, "i");
      if (regex.test(lowerTitle)) {
        allMatches.push({ slug, keyword });
        break; // Cukup satu keyword per kategori
      }
    }
  }

  return {
    suggestedSlug: allMatches[0]?.slug ?? null,
    matchedKeyword: allMatches[0]?.keyword ?? null,
    allMatches: allMatches.map((m) => m.slug),
  };
}

// Fungsi: validasi apakah kategori yang dipilih masuk akal
export function validateCategoryChoice(title: string, chosenSlug: string): {
  isWarning: boolean;
  message: string | null;
  suggestedSlug: string | null;
  matchedKeyword: string | null;
} {
  const { suggestedSlug, matchedKeyword, allMatches } = suggestCategoryFromTitle(title);

  // Jika tidak ada match sama sekali → tidak ada warning
  if (allMatches.length === 0) {
    return { isWarning: false, message: null, suggestedSlug: null, matchedKeyword: null };
  }

  // Jika kategori yang dipilih ADA di daftar match → OK
  if (allMatches.includes(chosenSlug)) {
    return { isWarning: false, message: null, suggestedSlug: null, matchedKeyword: null };
  }

  // Ada match tapi kategori yang dipilih tidak match → WARNING
  const chosenName = CATEGORY_NAMES[chosenSlug] || chosenSlug;
  const suggestedName = CATEGORY_NAMES[suggestedSlug!] || suggestedSlug;
  
  return {
    isWarning: true,
    message: `Judul produk mengandung kata "${matchedKeyword}". Berdasarkan kata kunci tersebut, produk ini lebih cocok di kategori "${suggestedName}" daripada "${chosenName}".`,
    suggestedSlug,
    matchedKeyword,
  };
}