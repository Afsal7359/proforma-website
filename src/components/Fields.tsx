/**
 * Plain form controls styled by `globals.css`. Server-renderable, so pages can
 * compose them as children of a client <ActionForm>.
 */

type Base = {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
};

export function Field({
  name,
  label,
  hint,
  required,
  type = "text",
  defaultValue,
  placeholder,
  min,
  max,
  step,
  autoFocus,
}: Base & {
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number | string;
  autoFocus?: boolean;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        min={min}
        max={max}
        step={step}
        autoFocus={autoFocus}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function TextArea({
  name,
  label,
  hint,
  required,
  defaultValue,
  placeholder,
  rows,
}: Base & {
  defaultValue?: string | null;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export type Option = { value: string; label: string };

export function Select({
  name,
  label,
  hint,
  required,
  options,
  defaultValue,
  placeholder,
}: Base & {
  options: Option[];
  defaultValue?: string | null;
  placeholder?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={name}>
        {label}
        {required && " *"}
      </label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue ?? ""}
        required={required}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

export function Checkbox({
  name,
  label,
  hint,
  defaultChecked,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="field">
      <label
        htmlFor={name}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          textTransform: "none",
          letterSpacing: 0,
          fontFamily: "var(--font-body)",
          fontSize: 14,
          fontWeight: 500,
          color: "var(--body)",
          cursor: "pointer",
        }}
      >
        <input
          id={name}
          name={name}
          type="checkbox"
          defaultChecked={defaultChecked}
          style={{ width: 17, height: 17, accentColor: "var(--blue)" }}
        />
        {label}
      </label>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

/** Groups fields onto one row at ≥600px. */
export function Row({
  children,
  cols = 2,
}: {
  children: React.ReactNode;
  cols?: 2 | 3;
}) {
  return (
    <div className={`field-row${cols === 3 ? " three" : ""}`}>{children}</div>
  );
}

/* ── shared option sets ──────────────────────────────────────────────── */

export const CLIENT_STATUS_OPTIONS: Option[] = [
  { value: "lead", label: "Lead" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "alumni", label: "Alumni" },
];

export const SUB_STATUS_OPTIONS: Option[] = [
  { value: "none", label: "No subscription" },
  { value: "trial", label: "Trial" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "cancelled", label: "Cancelled" },
];

export const PAYMENT_STATUS_OPTIONS: Option[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

export const PAYMENT_METHOD_OPTIONS: Option[] = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Credit / Debit Card" },
  { value: "netbanking", label: "Net Banking" },
  { value: "wallet", label: "Wallet" },
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

export const TRIAL_STATUS_OPTIONS: Option[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "open", label: "Open for registration" },
  { value: "closed", label: "Closed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export const REGISTRATION_STATUS_OPTIONS: Option[] = [
  { value: "registered", label: "Registered" },
  { value: "confirmed", label: "Confirmed" },
  { value: "attended", label: "Attended" },
  { value: "selected", label: "Selected" },
  { value: "not_selected", label: "Not selected" },
  { value: "no_show", label: "No show" },
  { value: "cancelled", label: "Cancelled" },
];

export const ASSIGNMENT_STATUS_OPTIONS: Option[] = [
  { value: "assigned", label: "Assigned" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "paused", label: "Paused" },
];

export const ATTENDANCE_OPTIONS: Option[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
  { value: "excused", label: "Excused" },
];

export const CYCLE_OPTIONS: Option[] = [
  { value: "monthly", label: "Monthly" },
  { value: "annual", label: "Annual" },
];

export const POSITION_OPTIONS: Option[] = [
  { value: "Striker", label: "Striker" },
  { value: "Winger", label: "Winger" },
  { value: "Attacking Mid", label: "Attacking Mid" },
  { value: "Central Mid", label: "Central Mid" },
  { value: "Defensive Mid", label: "Defensive Mid" },
  { value: "Center-Back", label: "Center-Back" },
  { value: "Full-Back", label: "Full-Back" },
  { value: "Goalkeeper", label: "Goalkeeper" },
];
