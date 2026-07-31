import { CatalogPage } from "@/components/catalog-page";
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  return (
    <CatalogPage
      title={q ? `Results for “${q}”` : "Search Voltixa"}
      query={q}
      description={
        q
          ? "Compare prices, specifications and availability across our verified catalog."
          : "Search authentic electronics by product, category or brand."
      }
    />
  );
}
