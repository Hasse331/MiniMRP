import type { ReactNode } from "react";

export function InfoTooltip({
  label,
  children
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <span className="info-tooltip" tabIndex={0} aria-label={label}>
      <span className="info-tooltip-icon" aria-hidden="true">
        i
      </span>
      <span className="info-tooltip-content" role="tooltip">
        {children}
      </span>
    </span>
  );
}
