import { PageHeader } from "@/components/PageHeader";
import { DirectoryView } from "@/components/DirectoryView";

export default function DirectoryPage() {
  return (
    <div>
      <PageHeader
        title="Directory"
        subtitle="Auto-organized documents with compliance alerts."
      />
      <DirectoryView />
    </div>
  );
}
