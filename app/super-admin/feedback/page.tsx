import { listFeedback } from "@/lib/feedback";
import { FeedbackInboxClient } from "./_client";

export default async function SuperAdminFeedbackPage() {
  const feedback = await listFeedback();
  return <FeedbackInboxClient initial={feedback} />;
}
