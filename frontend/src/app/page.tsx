import { PageHeader } from "@/components/PageHeader";
import { AssistantView } from "@/components/AssistantView";

export default function HomePage() {
  return (
    <div>
      <PageHeader
        title="AI Assistant"
        subtitle="Chat with your document knowledge base — answers with citations."
      />
      <AssistantView />
    </div>
  );
}
