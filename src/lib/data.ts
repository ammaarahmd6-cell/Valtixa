import catalogJson from "../../catalog/catalog.json";

export type Product = {
  id: string;
  slug: string;
  brand: string;
  name: string;
  category: string;
  price: number;
  retail: number;
  rating: number;
  reviews: number;
  stock: number;
  badge?: string;
  color: string;
  image: string;
  description: string;
  specs: Record<string, string>;
  variants: { id: string; label: string; price: number; stock: number }[];
};

type CatalogFile = {
  categories: { slug: string; name: string; image: string }[];
  brands: string[];
  categoryBrands: Record<string, { name: string; slug: string }[]>;
  products: Product[];
};

const catalog = catalogJson as unknown as CatalogFile;

export const categories = catalog.categories.map(
  (category) => [category.slug, category.name, category.image] as const,
);
export const brands = catalog.brands;
export const categoryBrands = catalog.categoryBrands;
export const products = catalog.products;

export const getProduct = (slug: string) =>
  products.find((product) => product.slug === slug);
export const getCategory = (slug: string) =>
  categories.find((category) => category[0] === slug);

export const faqs = [
  [
    "Are VOLTIXA products authentic?",
    "Yes. Every catalog item is sourced through verified distribution channels and includes the warranty shown on its product page.",
  ],
  [
    "Where do you deliver?",
    "We deliver to serviceable addresses across Pakistan. The delivery estimate appears at checkout after you select your city.",
  ],
  [
    "Can I pay cash on delivery?",
    "COD is available for eligible orders and locations. Higher-value orders may require advance verification.",
  ],
  [
    "How do returns work?",
    "Eligible unopened products can be requested for return from your order page within the stated return window.",
  ],
];
