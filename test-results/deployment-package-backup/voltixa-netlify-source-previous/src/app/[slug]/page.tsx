import { CatalogPage } from "@/components/catalog-page";
import { ContentPage } from "@/components/content-page";
const catalog = ["deals", "new-arrivals", "best-sellers"];
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (catalog.includes(slug))
    return (
      <CatalogPage
        title={slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
        description="Explore curated Voltixa picks with verified availability and transparent pricing."
      />
    );
  return <ContentPage slug={slug} />;
}
