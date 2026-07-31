import fs from "node:fs";
import path from "node:path";

const slugify = (value) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");

const categories = [
  [
    "mobile-phones",
    "Mobile Phones",
    "/images/products/category-mobile-phones.webp",
  ],
  ["laptops", "Laptops", "/images/products/category-laptops.webp"],
  ["desktops", "Desktop Computers", "/images/products/category-desktops.webp"],
  [
    "mobile-accessories",
    "Mobile Accessories",
    "/images/products/category-mobile-accessories.webp",
  ],
  [
    "laptop-accessories",
    "Laptop Accessories",
    "/images/products/category-laptop-accessories.webp",
  ],
  [
    "smartwatches",
    "Smartwatches",
    "/images/products/category-smartwatches.webp",
  ],
  ["audio", "Audio", "/images/products/category-audio.webp"],
];

const categoryBrands = {
  "mobile-phones": [
    "Apple",
    "Samsung",
    "Xiaomi",
    "Redmi",
    "Poco",
    "Realme",
    "Oppo",
    "Vivo",
    "OnePlus",
    "Google Pixel",
    "Huawei",
    "Honor",
    "Nokia",
    "Motorola",
    "Tecno",
    "Infinix",
    "itel",
    "Sony",
    "ASUS",
    "Nothing",
  ],
  laptops: [
    "Apple",
    "Dell",
    "HP",
    "Lenovo",
    "ASUS",
    "Acer",
    "Microsoft",
    "Samsung",
    "LG",
    "Huawei",
    "Toshiba",
  ],
  desktops: ["Dell", "HP", "Lenovo", "Apple", "ASUS", "Acer"],
  "mobile-accessories": [
    "Apple",
    "Samsung",
    "Xiaomi",
    "JBL",
    "Sony",
    "Soundcore",
  ],
  "laptop-accessories": [
    "Logitech",
    "HP",
    "Dell",
    "Lenovo",
    "ASUS",
    "Acer",
    "Microsoft",
    "SanDisk",
    "Seagate",
    "Samsung",
    "TP-Link",
    "Cooler Master",
  ],
  smartwatches: [
    "Apple",
    "Samsung",
    "Huawei",
    "Xiaomi",
    "Noise",
    "boAt",
    "CMF by Nothing",
  ],
  audio: [
    "Sony",
    "JBL",
    "Bose",
    "Apple",
    "Samsung",
    "Soundcore",
    "Beats",
    "Skullcandy",
    "Sennheiser",
    "Nothing",
    "Realme",
    "Xiaomi",
    "Oraimo",
  ],
};

const catalogRows = {
  "mobile-phones": [
    ["Apple", "Apple iPhone 17 Pro", 389999, 419999],
    ["Samsung", "Samsung Galaxy S26 Ultra", 434999, 459999],
    ["Xiaomi", "Xiaomi 16 Ultra", 329999, 349999],
    ["Redmi", "Redmi Note 15 Pro+ 5G", 149999, 164999],
    ["Poco", "Poco X8 Pro 5G", 139999, 154999],
    ["Google Pixel", "Google Pixel 10 Pro", 319999, 344999],
    ["OnePlus", "OnePlus 14", 279999, 299999],
    ["Oppo", "Oppo Find X9 Pro", 289999, 319999],
    ["Vivo", "Vivo X300 Pro", 299999, 329999],
    ["Infinix", "Infinix Note 60 Pro", 94999, 104999],
  ],
  laptops: [
    ["Apple", "Apple MacBook Air 13 M5", 399999, 429999],
    ["Dell", "Dell XPS 14", 439999, 469999],
    ["HP", "HP Spectre x360 14", 419999, 449999],
    ["Lenovo", "Lenovo Yoga 9i 2-in-1 Gen 11", 449999, 479999],
    ["ASUS", "ASUS Zenbook S 16", 399999, 429999],
    ["Acer", "Acer Swift 16 AI", 349999, 379999],
    ["Microsoft", "Microsoft Surface Laptop", 419999, 449999],
    ["Samsung", "Samsung Galaxy Book6 Pro", 429999, 459999],
    ["LG", "LG gram Pro 17", 469999, 499999],
    ["Huawei", "Huawei MateBook X Pro", 449999, 479999],
  ],
  desktops: [
    ["Apple", "Apple Mac mini", 219999, 239999],
    ["Apple", "Apple iMac 24", 479999, 509999],
    ["Dell", "Dell XPS Desktop", 379999, 409999],
    ["Dell", "Dell OptiPlex 7020 Tower", 249999, 269999],
    ["HP", "HP OMEN 35L Gaming Desktop", 499999, 539999],
    ["HP", "HP Elite Mini 800 G9", 289999, 309999],
    ["Lenovo", "Lenovo Legion Tower 5", 449999, 479999],
    ["Lenovo", "Lenovo ThinkCentre M90q", 299999, 319999],
    ["ASUS", "ASUS ROG G700 Gaming Desktop", 589999, 629999],
    ["Acer", "Acer Predator Orion 7000", 649999, 699999],
  ],
  "mobile-accessories": [
    ["Apple", "Apple MagSafe Charger", 14999, 16999],
    ["Apple", "Apple 20W USB-C Power Adapter", 8499, 9499],
    ["Samsung", "Samsung 45W Power Adapter", 12999, 14999],
    ["Samsung", "Samsung Wireless Charger Duo", 18999, 21999],
    ["Xiaomi", "Xiaomi 67W GaN Charger", 10999, 12999],
    ["Xiaomi", "Xiaomi 20000mAh Power Bank", 13999, 15999],
    ["JBL", "JBL Go 4 Portable Speaker", 17999, 19999],
    ["Sony", "Sony WF-C710N Earbuds", 24999, 27999],
    ["Soundcore", "Soundcore MagGo Power Bank", 16999, 18999],
    ["Soundcore", "Soundcore Select 4 Go Speaker", 10999, 12999],
  ],
  "laptop-accessories": [
    ["Logitech", "Logitech MX Master 3S", 28999, 31999],
    ["Logitech", "Logitech MX Keys S", 32999, 35999],
    ["HP", "HP USB-C Dock G5", 39999, 44999],
    ["Dell", "Dell Thunderbolt Dock WD22TB4", 64999, 69999],
    ["Lenovo", "Lenovo Universal USB-C Dock", 42999, 46999],
    ["ASUS", "ASUS ROG Strix Scope II Keyboard", 44999, 48999],
    ["Acer", "Acer USB Type-C Dock III", 36999, 39999],
    ["Microsoft", "Microsoft Surface Arc Mouse", 22999, 24999],
    ["SanDisk", "SanDisk Extreme Portable SSD 1TB", 34999, 38999],
    ["Samsung", "Samsung Portable SSD T9 1TB", 39999, 43999],
  ],
  smartwatches: [
    ["Apple", "Apple Watch Series 11", 124999, 139999],
    ["Apple", "Apple Watch Ultra 3", 279999, 299999],
    ["Samsung", "Samsung Galaxy Watch8", 94999, 109999],
    ["Samsung", "Samsung Galaxy Watch Ultra", 179999, 199999],
    ["Huawei", "Huawei Watch 5", 119999, 134999],
    ["Xiaomi", "Xiaomi Watch S4", 49999, 54999],
    ["Noise", "Noise ColorFit Pro 6", 24999, 27999],
    ["boAt", "boAt Storm Infinity", 17999, 19999],
    ["CMF by Nothing", "CMF Watch 3 Pro", 22999, 24999],
    ["Samsung", "Samsung Galaxy Fit3", 19999, 22999],
  ],
  audio: [
    ["Sony", "Sony WH-1000XM6", 129999, 139999],
    ["JBL", "JBL Tour One M3", 109999, 119999],
    ["Bose", "Bose QuietComfort Ultra Headphones", 139999, 149999],
    ["Apple", "Apple AirPods Pro", 79999, 89999],
    ["Samsung", "Samsung Galaxy Buds3 Pro", 54999, 62999],
    ["Soundcore", "Soundcore Liberty 5", 29999, 33999],
    ["Beats", "Beats Studio Pro", 94999, 104999],
    ["Skullcandy", "Skullcandy Crusher ANC 2", 79999, 89999],
    ["Sennheiser", "Sennheiser Momentum 4 Wireless", 109999, 119999],
    ["Nothing", "Nothing Ear", 34999, 38999],
  ],
};

const categoryDetails = {
  "mobile-phones": {
    description:
      "PTA-ready smartphone with a premium display, dependable cameras, strong battery life and official local warranty.",
    specs: {
      Type: "Smartphone",
      Network: "4G / 5G",
      Warranty: "Official Pakistan warranty",
      SIM: "Dual SIM / eSIM",
    },
    variant: "Official PTA Approved",
  },
  laptops: {
    description:
      "Premium productivity laptop with a sharp display, fast solid-state storage and dependable everyday performance.",
    specs: {
      Type: "Laptop",
      Memory: "16GB",
      Storage: "512GB SSD",
      Warranty: "Official local warranty",
    },
    variant: "16GB · 512GB SSD",
  },
  desktops: {
    description:
      "Modern desktop computer configured for work, study, creative tasks and dependable long-term performance.",
    specs: {
      Type: "Desktop PC",
      Memory: "16GB",
      Storage: "512GB SSD",
      Warranty: "Official local warranty",
    },
    variant: "16GB · 512GB SSD",
  },
  "mobile-accessories": {
    description:
      "Authentic mobile accessory selected for safe charging, reliable connectivity and everyday portability.",
    specs: {
      Type: "Mobile accessory",
      Compatibility: "Universal / brand supported",
      Condition: "Brand new",
      Warranty: "Official warranty",
    },
    variant: "Standard",
  },
  "laptop-accessories": {
    description:
      "Reliable laptop accessory for a cleaner workspace, faster connectivity, storage or everyday productivity.",
    specs: {
      Type: "Laptop accessory",
      Connectivity: "USB-C / wireless as applicable",
      Condition: "Brand new",
      Warranty: "Official warranty",
    },
    variant: "Standard",
  },
  smartwatches: {
    description:
      "Modern smartwatch with activity tracking, notifications and a bright, durable everyday display.",
    specs: {
      Type: "Smartwatch",
      Tracking: "Health and activity",
      Wireless: "Bluetooth",
      Warranty: "Official warranty",
    },
    variant: "Standard",
  },
  audio: {
    description:
      "Premium audio product with clear sound, dependable wireless performance and comfortable everyday use.",
    specs: {
      Type: "Wireless audio",
      Connectivity: "Bluetooth",
      Charging: "USB-C",
      Warranty: "Official warranty",
    },
    variant: "Standard",
  },
};

const colors = [
  "#0f172a",
  "#2563eb",
  "#0891b2",
  "#7c3aed",
  "#ea580c",
  "#059669",
  "#334155",
  "#be123c",
  "#4f46e5",
  "#0f766e",
];
const badges = [
  "New",
  "Featured",
  "Popular",
  "Official",
  "Fast Delivery",
  "Best Seller",
  undefined,
  "Top Rated",
  undefined,
  "Value Pick",
];
const products = [];

for (const [categoryIndex, [categorySlug]] of categories.entries()) {
  const rows = catalogRows[categorySlug];
  rows.forEach(([brand, name, price, retail], index) => {
    const detail = categoryDetails[categorySlug];
    const productSlug = slugify(name);
    const stock = 8 + ((categoryIndex * 7 + index * 3) % 29);
    products.push({
      id: `p-${categoryIndex * 10 + index + 1}`,
      slug: productSlug,
      brand,
      name,
      category: categorySlug,
      price,
      retail,
      rating: Number((4.5 + ((index + categoryIndex) % 5) * 0.1).toFixed(1)),
      reviews: 12 + ((index * 17 + categoryIndex * 11) % 160),
      stock,
      badge: badges[index],
      color: colors[index],
      image: `/images/products/catalog-${categorySlug}-${String(index + 1).padStart(2, "0")}.webp`,
      description: `${name} is a genuine ${brand} product for Pakistan. ${detail.description}`,
      specs: { Brand: brand, Model: name, ...detail.specs },
      variants: [
        {
          id: `${productSlug}-standard`,
          label: detail.variant,
          price,
          stock,
        },
      ],
    });
  });
}

const output = {
  generatedAt: new Date().toISOString(),
  categories: categories.map(([slug, name, image]) => ({ slug, name, image })),
  categoryBrands: Object.fromEntries(
    Object.entries(categoryBrands).map(([category, brands]) => [
      category,
      brands.map((name) => ({ name, slug: slugify(name) })),
    ]),
  ),
  brands: [...new Set(Object.values(categoryBrands).flat())].sort((a, b) =>
    a.localeCompare(b),
  ),
  products,
};

const outputPath = path.resolve("catalog", "catalog.json");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(
  `Generated ${products.length} products across ${categories.length} categories at ${outputPath}`,
);
