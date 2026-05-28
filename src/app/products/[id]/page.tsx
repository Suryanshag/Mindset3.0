import ProductsView from "../products-view";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductsView initialDetailId={id} />;
}
