import { CatalogPage } from "@/components/catalog-page";
export default async function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const name = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <CatalogPage
      title={`${name} products`}
      query={name}
      description={`Explore the latest ${name} products available at Voltixa with official warranty.`}
    />
  );
}
