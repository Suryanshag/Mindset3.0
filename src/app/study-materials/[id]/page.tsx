import StudyMaterialsView from "../study-materials-view";

export default async function StudyMaterialDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudyMaterialsView initialDetailId={id} />;
}
