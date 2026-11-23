export interface CuratedLaptopSpec {
  slug: string;
  title: string;
  titleAr: string;
  brand: string;
  cpu: string;
  ram: string;
  storage: string;
  gpu: string;
  screen: string;
  priceEgp: number;
  grade: "A" | "B";
  images: [string, string];
}

export const CURATED_LAPTOPS: CuratedLaptopSpec[] = [
  {
    slug: "apple-macbook-pro-13-2020",
    title: "Apple MacBook Pro 13 (2020)",
    titleAr: "أبل ماك بوك برو ١٣ (٢٠٢٠)",
    brand: "Apple",
    cpu: "Core i5-1038NG7",
    ram: "16GB LPDDR4x",
    storage: "512GB SSD",
    gpu: "Intel Iris Plus",
    screen: '13.3" Retina',
    priceEgp: 32000,
    grade: "A",
    images: [
      "/products/laptops/apple-macbook-pro-13-2020/1.jpg",
      "/products/laptops/apple-macbook-pro-13-2020/2.jpg",
    ],
  },
  {
    slug: "dell-xps-15-9570",
    title: "Dell XPS 15 9570",
    titleAr: "ديل XPS 15 9570",
    brand: "Dell",
    cpu: "Core i7-8750H",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "GTX 1050 Ti 4GB",
    screen: '15.6" FHD',
    priceEgp: 18500,
    grade: "A",
    images: [
      "/products/laptops/dell-xps-15-9570/1.jpg",
      "/products/laptops/dell-xps-15-9570/2.jpg",
    ],
  },
  {
    slug: "dell-xps-13-9380",
    title: "Dell XPS 13 9380",
    titleAr: "ديل XPS 13 9380",
    brand: "Dell",
    cpu: "Core i7-8565U",
    ram: "16GB LPDDR3",
    storage: "512GB SSD",
    gpu: "Intel UHD 620",
    screen: '13.3" FHD',
    priceEgp: 14500,
    grade: "A",
    images: [
      "/products/laptops/dell-xps-13-9380/1.jpg",
      "/products/laptops/dell-xps-13-9380/2.jpg",
    ],
  },
  {
    slug: "dell-latitude-7420",
    title: "Dell Latitude 7420",
    titleAr: "ديل لاتيتيود 7420",
    brand: "Dell",
    cpu: "Core i7-1185G7",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "Intel Iris Xe",
    screen: '14" FHD',
    priceEgp: 21000,
    grade: "A",
    images: [
      "/products/laptops/dell-latitude-7420/1.jpg",
      "/products/laptops/dell-latitude-7420/2.jpg",
    ],
  },
  {
    slug: "dell-inspiron-16-plus-7610",
    title: "Dell Inspiron 16 Plus 7610",
    titleAr: "ديل إنسبايرون 16 بلس 7610",
    brand: "Dell",
    cpu: "Core i7-11800H",
    ram: "16GB DDR4",
    storage: "1TB SSD",
    gpu: "RTX 3060 6GB",
    screen: '16.0" 3K',
    priceEgp: 39000,
    grade: "A",
    images: [
      "/products/laptops/dell-inspiron-16-plus-7610/1.jpg",
      "/products/laptops/dell-inspiron-16-plus-7610/2.jpg",
    ],
  },
  {
    slug: "dell-g15-5511",
    title: "Dell G15 5511 Gaming",
    titleAr: "ديل G15 5511 للألعاب",
    brand: "Dell",
    cpu: "Core i7-11800H",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "RTX 3060 6GB",
    screen: '15.6" FHD 120Hz',
    priceEgp: 36999,
    grade: "A",
    images: [
      "/products/laptops/dell-g15-5511/1.jpg",
      "/products/laptops/dell-g15-5511/2.jpg",
    ],
  },
  {
    slug: "dell-precision-7530",
    title: "Dell Precision 7530 Workstation",
    titleAr: "ديل بريسيشن 7530 ورك ستيشن",
    brand: "Dell",
    cpu: "Core i7-8850H",
    ram: "32GB DDR4",
    storage: "512GB SSD",
    gpu: "Quadro P2000 4GB",
    screen: '15.6" FHD',
    priceEgp: 22000,
    grade: "B",
    images: [
      "/products/laptops/dell-precision-7530/1.jpg",
      "/products/laptops/dell-precision-7530/2.jpg",
    ],
  },
  {
    slug: "hp-elitebook-840-g7",
    title: "HP EliteBook 840 G7",
    titleAr: "إتش بي إليت بوك 840 G7",
    brand: "HP",
    cpu: "Core i7-10610U",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "Intel UHD",
    screen: '14" FHD',
    priceEgp: 16500,
    grade: "A",
    images: [
      "/products/laptops/hp-elitebook-840-g7/1.jpg",
      "/products/laptops/hp-elitebook-840-g7/2.jpg",
    ],
  },
  {
    slug: "hp-zbook-studio-g7",
    title: "HP ZBook Studio G7",
    titleAr: "إتش بي زد بوك ستوديو G7",
    brand: "HP",
    cpu: "Core i9-10885H",
    ram: "32GB DDR4",
    storage: "512GB SSD",
    gpu: "Quadro T2000 4GB",
    screen: '15.6" FHD',
    priceEgp: 36000,
    grade: "A",
    images: [
      "/products/laptops/hp-zbook-studio-g7/1.jpg",
      "/products/laptops/hp-zbook-studio-g7/2.jpg",
    ],
  },
  {
    slug: "hp-omen-15-dh",
    title: "HP Omen 15 Gaming",
    titleAr: "إتش بي أومن 15 للألعاب",
    brand: "HP",
    cpu: "Core i7-9750H",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "RTX 2060 6GB",
    screen: '15.6" FHD 144Hz',
    priceEgp: 24000,
    grade: "B",
    images: [
      "/products/laptops/hp-omen-15-dh/1.jpg",
      "/products/laptops/hp-omen-15-dh/2.jpg",
    ],
  },
  {
    slug: "lenovo-thinkpad-x1-carbon-g9",
    title: "Lenovo ThinkPad X1 Carbon Gen 9",
    titleAr: "لينوفو ثينك باد X1 كاربون الجيل التاسع",
    brand: "Lenovo",
    cpu: "Core i7-1165G7",
    ram: "16GB LPDDR4x",
    storage: "512GB SSD",
    gpu: "Intel Iris Xe",
    screen: '14" FHD+',
    priceEgp: 26000,
    grade: "A",
    images: [
      "/products/laptops/lenovo-thinkpad-x1-carbon-g9/1.jpg",
      "/products/laptops/lenovo-thinkpad-x1-carbon-g9/2.jpg",
    ],
  },
  {
    slug: "lenovo-thinkpad-t14-g1",
    title: "Lenovo ThinkPad T14 Gen 1",
    titleAr: "لينوفو ثينك باد T14 الجيل الأول",
    brand: "Lenovo",
    cpu: "Core i5-10310U",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "Intel UHD",
    screen: '14" FHD',
    priceEgp: 16500,
    grade: "B",
    images: [
      "/products/laptops/lenovo-thinkpad-t14-g1/1.jpg",
      "/products/laptops/lenovo-thinkpad-t14-g1/2.jpg",
    ],
  },
  {
    slug: "lenovo-loq-15irh8",
    title: "Lenovo LOQ 15IRH8 Gaming",
    titleAr: "لينوفو LOQ 15IRH8 للألعاب",
    brand: "Lenovo",
    cpu: "Core i7-13620H",
    ram: "8GB DDR5",
    storage: "512GB SSD",
    gpu: "RTX 4050 6GB",
    screen: '15.6" FHD 144Hz',
    priceEgp: 45000,
    grade: "A",
    images: [
      "/products/laptops/lenovo-loq-15irh8/1.jpg",
      "/products/laptops/lenovo-loq-15irh8/2.jpg",
    ],
  },
  {
    slug: "asus-rog-zephyrus-g14",
    title: "Asus ROG Zephyrus G14",
    titleAr: "أسوس ROG زيفيروس G14",
    brand: "Asus",
    cpu: "Ryzen 7 4800HS",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "RTX 2060 Max-Q 6GB",
    screen: '14" FHD 120Hz',
    priceEgp: 29500,
    grade: "A",
    images: [
      "/products/laptops/asus-rog-zephyrus-g14/1.jpg",
      "/products/laptops/asus-rog-zephyrus-g14/2.jpg",
    ],
  },
  {
    slug: "acer-nitro-5-an515",
    title: "Acer Nitro 5 AN515-55",
    titleAr: "أيسر نيترو 5 AN515-55",
    brand: "Acer",
    cpu: "Core i5-10300H",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "GTX 1650 4GB",
    screen: '15.6" FHD 144Hz',
    priceEgp: 19500,
    grade: "B",
    images: [
      "/products/laptops/acer-nitro-5-an515/1.jpg",
      "/products/laptops/acer-nitro-5-an515/2.jpg",
    ],
  },
  {
    slug: "msi-gf63-thin-10sc",
    title: "MSI GF63 Thin 10SC",
    titleAr: "إم إس آي GF63 Thin",
    brand: "MSI",
    cpu: "Core i7-10750H",
    ram: "16GB DDR4",
    storage: "512GB SSD",
    gpu: "GTX 1650 4GB",
    screen: '15.6" FHD 144Hz',
    priceEgp: 21000,
    grade: "B",
    images: [
      "/products/laptops/msi-gf63-thin-10sc/1.jpg",
      "/products/laptops/msi-gf63-thin-10sc/2.jpg",
    ],
  },
];

export const CURATED_FURNITURE: CuratedLaptopSpec[] = [
  {
    slug: "herman-miller-aeron-chair",
    title: "Ergonomic Mesh Office Chair (Pro)",
    titleAr: "كرسي مكتب طبي شبكي احترافي",
    brand: "Herman Miller",
    cpu: "Breathable 8Z Mesh",
    ram: "68×68×104cm",
    storage: "Adjustable Lumbar Support",
    gpu: "Reinforced Frame",
    screen: "150 kg Load Capacity",
    priceEgp: 2450,
    grade: "A",
    images: [
      "/products/furniture/herman-miller-aeron-chair/1.jpg",
      "/products/furniture/herman-miller-aeron-chair/2.jpg",
    ],
  },
  {
    slug: "steelcase-leap-v2-chair",
    title: "Executive High-Back Office Chair",
    titleAr: "كرسي مكتب تنفيذي بظهر مرتفع",
    brand: "Steelcase",
    cpu: "Breathable Fabric",
    ram: "69×63×105cm",
    storage: "LiveBack + 4D Arms",
    gpu: "Steel Base",
    screen: "136 kg Load Capacity",
    priceEgp: 3200,
    grade: "A",
    images: [
      "/products/furniture/steelcase-leap-v2-chair/1.jpg",
      "/products/furniture/steelcase-leap-v2-chair/2.jpg",
    ],
  },
  {
    slug: "autonomous-smartdesk-pro",
    title: "Motorized Sit-Stand Office Desk (150cm)",
    titleAr: "مكتب عمل كهربائي متحرك (١٥٠ سم)",
    brand: "Autonomous",
    cpu: "Walnut Top + Steel Frame",
    ram: "150×75×(66–132)cm",
    storage: "Dual-Motor Electric Lift",
    gpu: "4-Memory Keypad",
    screen: "140 kg Lift Capacity",
    priceEgp: 5800,
    grade: "A",
    images: [
      "/products/furniture/autonomous-smartdesk-pro/1.jpg",
      "/products/furniture/autonomous-smartdesk-pro/2.jpg",
    ],
  },
  {
    slug: "ikea-bekant-workstation",
    title: "IKEA Bekant Oak Office Desk (160cm)",
    titleAr: "مكتب عمل أيكيا بيكانت خشب بلوط",
    brand: "IKEA",
    cpu: "Natural Oak Veneer",
    ram: "160×80×75cm",
    storage: "Steel Underframe",
    gpu: "Integrated Cable Net",
    screen: "100 kg Load Capacity",
    priceEgp: 3400,
    grade: "B",
    images: [
      "/products/furniture/ikea-bekant-workstation/1.jpg",
      "/products/furniture/ikea-bekant-workstation/2.jpg",
    ],
  },
  {
    slug: "haworth-zody-task-chair",
    title: "Mesh Task & Study Swivel Chair",
    titleAr: "كرسي عمل ودراسة دوار شبكي",
    brand: "Haworth",
    cpu: "High-Tension Mesh",
    ram: "74×74×102cm",
    storage: "Asymmetric Lumbar System",
    gpu: "Aluminum Base",
    screen: "135 kg Load Capacity",
    priceEgp: 1850,
    grade: "A",
    images: [
      "/products/furniture/haworth-zody-task-chair/1.jpg",
      "/products/furniture/haworth-zody-task-chair/2.jpg",
    ],
  },
  {
    slug: "west-elm-walnut-desk",
    title: "Walnut Executive Office Desk (150cm)",
    titleAr: "مكتب مدير كلاسيكي خشب جوز",
    brand: "West Elm",
    cpu: "Kiln-Dried Walnut Wood",
    ram: "152×66×76cm",
    storage: "Dual Soft-Close Drawers",
    gpu: "Brass Hardware",
    screen: "FSC Certified Timber",
    priceEgp: 4600,
    grade: "A",
    images: [
      "/products/furniture/west-elm-walnut-desk/1.jpg",
      "/products/furniture/west-elm-walnut-desk/2.jpg",
    ],
  },
  {
    slug: "humanscale-freedom-chair",
    title: "Ergonomic Headrest Manager Chair",
    titleAr: "كرسي مدير طبي بمسند رأس",
    brand: "Humanscale",
    cpu: "Gel Cushion + Textile",
    ram: "64×64×122cm",
    storage: "Weight-Sensitive Recline",
    gpu: "Articulating Headrest",
    screen: "136 kg Load Capacity",
    priceEgp: 2950,
    grade: "A",
    images: [
      "/products/furniture/humanscale-freedom-chair/1.jpg",
      "/products/furniture/humanscale-freedom-chair/2.jpg",
    ],
  },
  {
    slug: "steelcase-conference-table",
    title: "6-Seat Office Conference Table (240cm)",
    titleAr: "طاولة اجتماعات مكتبية لستة أفراد",
    brand: "Steelcase",
    cpu: "Acoustic Ash Laminate",
    ram: "240×110×75cm",
    storage: "Integrated Power & USB Dock",
    gpu: "Powder-Coated Steel Legs",
    screen: "6–8 Person Capacity",
    priceEgp: 6800,
    grade: "B",
    images: [
      "/products/furniture/steelcase-conference-table/1.jpg",
      "/products/furniture/steelcase-conference-table/2.jpg",
    ],
  },
];

export const ALL_CURATED_PRODUCTS: CuratedLaptopSpec[] = [
  ...CURATED_LAPTOPS,
  ...CURATED_FURNITURE,
];

export interface ResolvedProductMedia {
  images: string[];
  brand?: string;
  cpu?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  screen?: string;
}

export function resolveProductMedia(
  title: string,
  rawDiagnosticAnswers?: unknown,
): ResolvedProductMedia {
  const diagnosticAnswers =
    typeof rawDiagnosticAnswers === "object" &&
    rawDiagnosticAnswers !== null &&
    !Array.isArray(rawDiagnosticAnswers)
      ? (rawDiagnosticAnswers as Record<string, unknown>)
      : null;
  const slugHint =
    typeof diagnosticAnswers?.slug === "string" ? diagnosticAnswers.slug : null;
  const normalizedTitle = title.toLowerCase();

  const match =
    (slugHint && ALL_CURATED_PRODUCTS.find((l) => l.slug === slugHint)) ||
    ALL_CURATED_PRODUCTS.find((l) =>
      normalizedTitle.includes(l.title.toLowerCase().split(" ").slice(0, 3).join(" ")),
    ) ||
    ALL_CURATED_PRODUCTS.find((l) =>
      normalizedTitle.includes(l.brand.toLowerCase()),
    );

  if (match) {
    return {
      images: match.images,
      brand: (diagnosticAnswers?.brand as string) ?? match.brand,
      cpu: (diagnosticAnswers?.cpu as string) ?? match.cpu,
      ram: (diagnosticAnswers?.ram as string) ?? match.ram,
      storage: (diagnosticAnswers?.storage as string) ?? match.storage,
      gpu: (diagnosticAnswers?.gpu as string) ?? match.gpu,
      screen: (diagnosticAnswers?.screen as string) ?? match.screen,
    };
  }

  return {
    images: ["/products/laptops/dell-latitude-7420/1.jpg"],
    cpu: typeof diagnosticAnswers?.cpu === "string" ? diagnosticAnswers.cpu : undefined,
    ram: typeof diagnosticAnswers?.ram === "string" ? diagnosticAnswers.ram : undefined,
    storage:
      typeof diagnosticAnswers?.storage === "string"
        ? diagnosticAnswers.storage
        : undefined,
  };
}
