import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TransactionTable } from "@/components/dashboard/TransactionTable";
import { getTransactions } from "@/lib/data";

export const metadata: Metadata = {
  title: "Transactions",
  description: "Every recorded transaction on your account.",
};

const FILTERS = ["all", "deposit", "investment", "return", "withdrawal"] as const;
type Filter = (typeof FILTERS)[number];

function isFilter(value: string | undefined): value is Filter {
  return FILTERS.includes((value ?? "") as Filter);
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  /* Filtering happens in the query, not in the browser, so a page never
     holds rows it then hides. */
  const active: Filter = isFilter(type) ? type : "all";
  const transactions = await getTransactions({ type: active });

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Every deposit, investment, return and withdrawal recorded on your account."
      />
      <TransactionTable transactions={transactions} active={active} filters={[...FILTERS]} />
    </>
  );
}
