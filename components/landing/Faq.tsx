"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { Reveal } from "@/components/ui/Reveal";
import { Section, SectionHead } from "@/components/landing/Sections";

const ITEMS = [
  {
    q: "What is QuickStark?",
    a: "QuickStark is an investment platform. You open an account, choose an investment plan, fund it, and then track its value and activity from your dashboard.",
  },
  {
    q: "How do investments work?",
    a: "You select a plan, review its minimum and duration, and fund it from your account balance. The investment then runs for its stated term and appears in your dashboard with its start and maturity dates.",
  },
  {
    q: "How can I track my investment?",
    a: "Your dashboard shows your total portfolio value, how it has changed over 1M, 3M, 6M and 1Y, your active investment and a dated list of every transaction on the account.",
  },
  {
    q: "When can I withdraw?",
    a: "Withdrawal eligibility follows the terms of the plan you invested in. Each plan states its duration, and your dashboard shows the maturity date for your active investment. Requests are made from your account.",
  },
  {
    q: "How are transactions recorded?",
    a: "Deposits, investments, returns and withdrawals are each recorded as a dated entry with an amount and a status. The full history is available in your account.",
  },
  {
    q: "How do I verify my account?",
    a: "Verification is completed from your account after you sign up. Your dashboard shows your current verification status and what, if anything, is still outstanding.",
  },
];

export function Faq() {
  /* One panel open at a time keeps the section compact. */
  const [open, setOpen] = useState<number | null>(null);

  return (
    <Section id="faq">
      <div className="max-w-[820px]">
        <SectionHead eyebrow="FAQ" title="Questions, answered." />

        <Reveal>
          <div className="overflow-hidden rounded-lg border border-[var(--line)] bg-ink-850">
            {ITEMS.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className="border-b border-[var(--line)] last:border-b-0">
                  <h3>
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-button-${i}`}
                      className="flex w-full items-center justify-between gap-[18px] px-[22px] py-[19px] text-left text-[0.9375rem] font-medium text-mist-50 transition-colors hover:bg-ink-800"
                    >
                      {item.q}
                      <span
                        className={`grid flex-none place-items-center transition-[transform,color] duration-200 ${
                          isOpen ? "rotate-180 text-accent-500" : "text-mist-500"
                        }`}
                      >
                        <Icon name="chevronDown" size={17} />
                      </span>
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-button-${i}`}
                    hidden={!isOpen}
                  >
                    <p className="max-w-[68ch] px-[22px] pb-5 text-sm leading-[1.68] text-mist-400">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal>
          <p className="mt-5 text-xs leading-[1.65] text-mist-500">
            Nothing on this page is financial advice. Investing carries risk,
            including the risk of losing money.
          </p>
        </Reveal>
      </div>
    </Section>
  );
}
