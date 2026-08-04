import { renderEditorPolicyPreview } from "../policy";

export default function EditorTermsPreview(props: { params: Promise<{ id: string }> }) {
  return renderEditorPolicyPreview(props.params, "terms");
}
