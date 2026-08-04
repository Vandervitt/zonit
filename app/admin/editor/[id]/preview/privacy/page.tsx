import { renderEditorPolicyPreview } from "../policy";

export default function EditorPrivacyPreview(props: { params: Promise<{ id: string }> }) {
  return renderEditorPolicyPreview(props.params, "privacy");
}
