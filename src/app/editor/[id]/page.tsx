import { EditorLoader } from "./loader";

export const metadata = { title: "Editor" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EditorLoader id={id} />;
}
