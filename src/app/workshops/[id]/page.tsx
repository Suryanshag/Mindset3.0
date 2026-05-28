import WorkshopsView from "../workshops-view";

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <WorkshopsView initialDetailId={id} />;
}
