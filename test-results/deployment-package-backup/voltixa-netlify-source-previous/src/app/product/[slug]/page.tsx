import { notFound } from "next/navigation";
import { ProductDetail } from "@/components/product-detail";
import { getProduct } from "@/lib/data";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
