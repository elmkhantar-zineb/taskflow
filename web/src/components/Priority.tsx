import type { Priority } from "../types.ts";

const priorities: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "normal", label: "Normal" },
  { id: "high", label: "High" },
];

function priorityLabel(priority: Priority) {
  return priorities.find((option) => option.id === priority)?.label ?? "Normal";
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span className={`priority-badge priority-${priority}`}>
      <span className="priority-dot" />
      {priorityLabel(priority)}
    </span>
  );
}

export function PriorityPicker({
  value,
  onChange,
  disabled = false,
}: {
  value: Priority;
  onChange: (priority: Priority) => void;
  disabled?: boolean;
}) {
  return (
    <div className="priority-picker" role="radiogroup" aria-label="Priority">
      {priorities.map((option) => (
        <button
          key={option.id}
          type="button"
          role="radio"
          className={`priority-option priority-${option.id}`}
          aria-checked={value === option.id}
          disabled={disabled}
          onClick={() => onChange(option.id)}
        >
          <span className="priority-dot" />
          {option.label}
        </button>
      ))}
    </div>
  );
}
