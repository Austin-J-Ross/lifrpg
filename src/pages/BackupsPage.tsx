import { PageHeading } from '../components/ui/PageHeading';
import { DataTransfer } from '../features/profile/DataTransfer';

export function BackupsPage() {
  return (
    <section className="page">
      <PageHeading title="Backups" />
      <DataTransfer />
    </section>
  );
}
