import { notFound } from "next/navigation";
import { CatalogPage } from "@/components/catalog-page";
import { getCategory } from "@/lib/data";
export default async function Category({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cat = getCategory(slug);
  if (!cat) notFound();
  return (
    <CatalogPage
      title={cat[1]}
      category={slug}
      description={`Shop carefully selected ${cat[1].toLowerCase()} with transparent prices, official warranty and delivery across Pakistan.`}
    />
  );
}
