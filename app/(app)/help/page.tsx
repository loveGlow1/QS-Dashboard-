import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Help" };

const ANSWERS = [
  {
    q: "How do I start an investment?",
    a: "Open Investments, choose the tier that matches what you want to invest, and follow the steps. Each tier states its range and its term before you commit.",
  },
  {
    q: "How is my portfolio value calculated?",
    a: "Your portfolio value comes from your investment records and the recorded ledger on our servers. It is never calculated in your browser, so what you see is what our systems hold.",
  },
  {
    q: "When can I withdraw?",
    a: "Funds become eligible according to the terms of the investment holding them. Your dashboard shows the maturity date for each active investment, and the Withdraw page shows what is currently eligible.",
  },
  {
    q: "How do I deposit?",
    a: "Deposit processing is being connected. Until it is live, deposits cannot be made from the app.",
  },
  {
    q: "Where can I see my transactions?",
    a: "Transactions lists every deposit, investment, return and withdrawal recorded on your account, with its date, amount and status. You can filter by type.",
  },
  {
    q: "How do I contact support?",
    a: "Support contact details will appear here once they are published.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader title="Help" subtitle="How your account works." />
      <div className="grid max-w-[760px] gap-3">
        {ANSWERS.map((item) => (
          <Card key={item.q}>
            <h2 className="text-[0.9375rem] font-semibold tracking-[-0.015em]">{item.q}</h2>
            <p className="mt-2 text-[0.875rem] leading-[1.68] text-mist-400">{item.a}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
