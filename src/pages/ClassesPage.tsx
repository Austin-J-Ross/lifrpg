import { useState } from 'react';
import { useApp } from '../state/AppProvider';
import { PageHeading } from '../components/ui/PageHeading';
import { EmptyState } from '../components/ui/EmptyState';
import { ClassCard } from '../features/classes/ClassCard';
import { ClassForm } from '../features/classes/ClassForm';
export function ClassesPage() {
  const { state } = useApp();
  const [open, setOpen] = useState(false);
  return (
    <section className="page">
      <PageHeading
        title="Your classes"
        description="Build skills in every part of your life."
      >
        <button className="add-button" onClick={() => setOpen(true)}>
          + New class
        </button>
      </PageHeading>
      <p className="progression-note">
        Skill levels start at 1. Each next level costs 50% more XP, starting at
        100 XP.
      </p>
      {state.classes.length ? (
        <div className="class-cards">
          {state.classes.map((c) => (
            <ClassCard key={c.id} entry={c} />
          ))}
        </div>
      ) : (
        <EmptyState>
          Create your first class to begin adding skills and quests.
        </EmptyState>
      )}
      {open && <ClassForm onClose={() => setOpen(false)} />}
    </section>
  );
}
