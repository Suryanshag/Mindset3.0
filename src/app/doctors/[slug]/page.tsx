import DoctorsView from "../doctors-view";

export default async function DoctorDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <DoctorsView initialSlug={slug} />;
}
