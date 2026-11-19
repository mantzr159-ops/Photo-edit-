import { ShareViewer } from "./viewer";

export const metadata = { title: "Shared design", robots: { index: false } };

export default async function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ShareViewer token={token} />;
}
