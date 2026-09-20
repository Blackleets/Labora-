import React from 'react';

/** Shared focus ring for primary form controls (keyboard). */
export const formControlFocusClass =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--labora-primary)]';

type FieldLabelProps = {
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
};

/** Visible label wired with htmlFor — prefer over orphan text labels. */
export const FieldLabel: React.FC<FieldLabelProps> = ({
  htmlFor,
  children,
  className = 'mb-1.5 block text-[11px] font-extrabold text-[var(--labora-muted)]',
}) => (
  <label htmlFor={htmlFor} className={className}>
    {children}
  </label>
);

type FormErrorProps = {
  id: string;
  children: React.ReactNode;
};

/** Inline form error with role=alert for screen readers. */
export const FormError: React.FC<FormErrorProps> = ({ id, children }) => {
  if (children == null || children === false || children === '') return null;
  return (
    <p
      id={id}
      role="alert"
      className="rounded-[13px] border border-[var(--labora-border)] bg-[var(--labora-soft-clay)] px-3 py-2.5 text-xs font-medium text-[var(--labora-clay)]"
    >
      {children}
    </p>
  );
};

/** aria-invalid + aria-describedby when a form-level error is shown. */
export const fieldErrorA11y = (errorId: string, hasError: boolean) =>
  hasError
    ? ({ 'aria-invalid': true as const, 'aria-describedby': errorId })
    : {};
