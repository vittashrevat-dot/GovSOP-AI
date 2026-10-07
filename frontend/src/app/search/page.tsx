import { PageHeader } from "@/components/PageHeader";
import { SearchView } from "@/components/SearchView";

export default function SearchPage() {
  return (
    <div>
      <PageHeader
        title="Search"
        subtitle="Find policies, SOPs, and circulars by keyword."
      />
      <SearchView />
    </div>
  );
}
