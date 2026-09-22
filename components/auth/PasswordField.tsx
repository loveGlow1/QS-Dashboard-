"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { FIELD_CLASS } from "./AuthShell";

export function PasswordField({
  id,
  name = "password",
  autoComplete,
  placeholder,
}: {
  id: string;
  name?: string;
  autoComplete: "current-password" | "new-password";
  placeholder: string;
}) {
  const [shown, setShown] = useState(false);

  return (
    <div className="relative flex">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required
        className={`${FIELD_CLASS} pr-[46px]`}
      />
      <button
        type="button"
        onClick={() => setShown((v) => !v)}
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        className="absolute right-[5px] top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-sm text-mist-400 transition-colors hover:bg-[rgba(148,168,214,0.08)] hover:text-mist-50"
      >
        <Icon name={shown ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
