import { PageHeading } from '../components/ui/PageHeading';
import { ProfileForm } from '../features/profile/ProfileForm';
import { DataTransfer } from '../features/profile/DataTransfer';
export function AboutPage() {
  return (
    <section className="page">
      <PageHeading
        title="About you"
        description="The personal details shown on your home screen."
      />
      <ProfileForm />
      <DataTransfer />
    </section>
  );
}
