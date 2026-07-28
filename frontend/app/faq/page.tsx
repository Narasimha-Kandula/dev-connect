'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const CATEGORIES = [
  {
    name: 'Getting Started',
    questions: [
      { q: 'How do I create an account?', a: 'Sign up with email or GitHub/Google OAuth. Your profile is auto-populated with GitHub data — you can customize it at any time.' },
      { q: 'Is DevConnect free?', a: 'Yes. The Free tier includes unlimited matching, chat, and up to 3 active projects. Pro and Enterprise tiers add video rooms, advanced analytics, and SSO.' },
      { q: 'How do I get my first match?', a: 'Complete your profile (skills, bio, availability) and start swiping in Discover. Our AI will rank compatible developers based on your tech stack and intent.' },
    ],
  },
  {
    name: 'Security',
    questions: [
      { q: 'How is my data protected?', a: 'All traffic is TLS 1.3 encrypted. Data at rest is AES-256 encrypted. We follow OWASP guidelines and undergo regular third-party security audits.' },
      { q: 'Can I control who sees my profile?', a: 'Yes. Profile visibility settings let you choose Public, Matches Only, or Private. You can also block specific users.' },
      { q: 'Do you sell my data?', a: 'Never. Your data belongs to you. We only use it to power the matching engine and improve the platform. See our Privacy Policy for details.' },
    ],
  },
  {
    name: 'Billing',
    questions: [
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards, PayPal, and bank transfers for Enterprise plans. Invoices are available for all paid tiers.' },
      { q: 'Can I cancel anytime?', a: 'Yes. You can downgrade or cancel at any time. Your plan remains active until the end of the billing period.' },
      { q: 'Is there a refund policy?', a: 'We offer a 14-day money-back guarantee on all paid plans. Contact support for assistance.' },
    ],
  },
  {
    name: 'Platform Usage',
    questions: [
      { q: 'What tech stacks are supported?', a: 'All major stacks. Our skill taxonomy covers 200+ technologies including React, Python, Go, Rust, Solidity, and AI/ML frameworks.' },
      { q: 'Can I use DevConnect for hiring?', a: 'Absolutely. The Recruiter plan lets you post jobs, search profiles, and message candidates directly. Enterprise plans include ATS integration.' },
      { q: 'Is there a mobile app?', a: 'Not yet, but the web app is fully responsive and works on mobile browsers. Native apps are on the roadmap for Q3 2026.' },
    ],
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [openCategory, setOpenCategory] = useState('Getting Started');

  const flatIndex = (catIdx: number, qIdx: number) => catIdx * 100 + qIdx;

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-6 py-16">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Everything You Need to Know
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          Quick answers to common questions. Can't find what you need? <a href="/contact" className="text-foreground underline">Contact us</a>.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => setOpenCategory(cat.name)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              openCategory === cat.name
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {CATEGORIES.filter((c) => c.name === openCategory).map((cat, catIdx) => (
        <div key={cat.name} className="space-y-2">
          {cat.questions.map((item, qIdx) => {
            const idx = flatIndex(catIdx, qIdx);
            const isOpen = openIndex === idx;
            return (
              <div key={qIdx} className="rounded-xl border border-border">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium"
                >
                  {item.q}
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-border px-5 py-4 text-sm text-muted-foreground leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: CATEGORIES.flatMap((cat) =>
              cat.questions.map((item) => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
              }))
            ),
          }),
        }}
      />
    </div>
  );
}
