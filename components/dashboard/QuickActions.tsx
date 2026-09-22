import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icon";

const ACTIONS: { href: string; icon: IconName; label: string }[] = [
  { href: "/investments", icon: "plus", label: "Invest" },
  { href: "/help#deposits", icon: "arrowDownLeft", label: "Deposit" },
  { href: "/withdraw", icon: "arrowUpRight", label: "Withdraw" },
  { href: "/transactions", icon: "list", label: "Transactions" },
];

export function QuickActions() {
  return (
    <div
      role="group"
      aria-label="Quick actions"
      className="flex flex-wrap gap-2 max-[720px]:-mx-[var(--dash-pad)] max-[720px]:w-[calc(100%+var(--dash-pad)*2)] max-[720px]:flex-nowrap max-[720px]:snap-x max-[720px]:snap-proximity max-[720px]:overflow-x-auto max-[720px]:px-[var(--dash-pad)] max-[720px]:[scrollbar-width:none] max-[720px]:[&::-webkit-scrollbar]:hidden"
    >
      {ACTIONS.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className="inline-flex h-[38px] flex-none items-center gap-2 whitespace-nowrap rounded-full border border-[var(--line)] bg-ink-800 px-[15px] text-[0.8125rem] font-medium text-mist-200 transition-[background-color,border-color,color,transform] hover:border-[var(--line-strong)] hover:bg-ink-600 hover:text-mist-50 active:translate-y-px max-[720px]:snap-start [&>svg]:text-mist-500 [&:hover>svg]:text-accent-500"
        >
          <Icon name={action.icon} size={16} />
          {action.label}
        </Link>
      ))}
    </div>
  );
}
