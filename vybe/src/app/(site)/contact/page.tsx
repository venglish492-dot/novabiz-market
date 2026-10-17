import type { Metadata } from 'next';
import { PageHeader } from '@/components/marketing/PageHeader';
import { ContactForm } from '@/components/marketing/ContactForm';

export const metadata: Metadata = { title: 'Contact', description: 'Get help with your VYBE page or report a problem.', alternates: { canonical: '/contact' } };

export default function ContactPage() {
  return (
    <>
      <PageHeader eyebrow="Contact" title="How can we help?" description="Messages go to the VYBE support inbox. To report a specific profile or file, use the Report button on it — that reaches moderators fastest." />
      <div className="container-page max-w-2xl py-12">
        <ContactForm />
      </div>
    </>
  );
}
