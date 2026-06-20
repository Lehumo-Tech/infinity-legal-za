'use client';

import { IntakeForm } from '@/components/LandingPage';

export default function LandingIntakeForm() {
  const handleSignUp = (email?: string, name?: string) => {
    if (typeof window !== 'undefined') {
      if (email) sessionStorage.setItem('il_intake_email', email);
      if (name) sessionStorage.setItem('il_intake_name', name);
      window.dispatchEvent(new CustomEvent('il-show-signup', { detail: { email, name } }));
    }
  };

  return <IntakeForm onSignUp={handleSignUp} />;
}
