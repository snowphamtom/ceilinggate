import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  summary?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

/**
 * Accessible disclosure — native <details>/<summary>
 * (keyboard Enter/Space, implicit aria-expanded).
 */
export function CalmDisclosure({
  id,
  title,
  summary,
  children,
  defaultOpen = false,
  className = "",
}: Props) {
  return (
    <details
      id={id}
      className={"sm-disclosure sm-glass " + className}
      data-testid={`disclosure-${id}`}
      open={defaultOpen || undefined}
    >
      <summary className="sm-disclosure-summary">
        <span className="sm-disclosure-title">{title}</span>
        {summary ? (
          <span className="sm-disclosure-hint">{summary}</span>
        ) : null}
        <span className="sm-disclosure-chevron" aria-hidden>
          ▾
        </span>
      </summary>
      <div className="sm-disclosure-body">{children}</div>
    </details>
  );
}
