/**
 * Marks the illustrated dashboard as a demo.
 *
 * It still has to read as a label rather than decoration — the figures beside
 * it are not anyone's account — but amber is the palette's warning colour and
 * this is not a warning. Silver says "sample" without suggesting something has
 * gone wrong, and sits with the product rather than interrupting it.
 */
export function DemoBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-[rgba(214,222,240,0.26)] bg-[linear-gradient(135deg,rgba(226,232,246,0.2),rgba(148,168,214,0.07)_46%,rgba(226,232,246,0.15))] px-[9px] py-[3px] text-[0.625rem] font-semibold normal-case tracking-[0.07em] text-[#dbe3f3] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)] ${className}`}
    >
      <span className="size-[5px] rounded-full bg-[linear-gradient(135deg,#f2f5fc,#9fb0d4)]" />
      Demo
    </span>
  );
}
