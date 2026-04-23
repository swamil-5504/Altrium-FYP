import { Check, Circle } from "lucide-react";

export interface PasswordRuleResult {
  label: string;
  ok: boolean;
}

export const PASSWORD_RULES = [
  { label: "At least 12 characters", test: (p: string) => p.length >= 12 },
  { label: "An uppercase letter (A–Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "A lowercase letter (a–z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "A digit (0–9)", test: (p: string) => /\d/.test(p) },
  { label: "A symbol (e.g. ! @ # $ %)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function evaluatePassword(password: string): PasswordRuleResult[] {
  return PASSWORD_RULES.map((r) => ({ label: r.label, ok: r.test(password) }));
}

export function isPasswordValid(password: string): boolean {
  return PASSWORD_RULES.every((r) => r.test(password));
}

interface Props {
  password: string;
  className?: string;
}

export function PasswordStrengthChecklist({ password, className = "" }: Props) {
  const results = evaluatePassword(password);
  const satisfied = results.filter((r) => r.ok).length;
  const pct = (satisfied / results.length) * 100;

  const barColor =
    satisfied <= 2
      ? "bg-red-500"
      : satisfied <= 3
      ? "bg-orange-500"
      : satisfied <= 4
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <ul className="space-y-1 text-xs">
        {results.map((r) => (
          <li
            key={r.label}
            className={`flex items-center gap-2 transition-colors ${
              r.ok ? "text-green-600 dark:text-green-400" : "text-muted-foreground"
            }`}
          >
            {r.ok ? (
              <Check className="w-3.5 h-3.5 shrink-0" aria-hidden />
            ) : (
              <Circle className="w-3.5 h-3.5 shrink-0" aria-hidden />
            )}
            <span>{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
