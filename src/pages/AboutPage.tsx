import { PageHeading } from '../components/ui/PageHeading';
import { ProfileForm } from '../features/profile/ProfileForm';
export function AboutPage() {
  return (
    <section className="page">
      <PageHeading title="About you" showQuestBadge={false} />
      <ProfileForm />
    </section>
  );
}
