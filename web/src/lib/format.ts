export function createdFromId(id: string): Date | null {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  const seconds = Number.parseInt(id.slice(0, 8), 16);
  if (!Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000);
}

export function formatWhen(date: Date, now = Date.now()): string {
  const diff = now - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) {
    const minutes = Math.round(diff / minute);
    return `${minutes}m ago`;
  }
  if (diff < day) {
    const hours = Math.round(diff / hour);
    return `${hours}h ago`;
  }
  if (diff < 7 * day) {
    const days = Math.round(diff / day);
    return `${days}d ago`;
  }
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatFull(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function truncate(value: string, max: number): string {
  const clean = value.trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

export function addedToday(ids: string[], now = new Date()): number {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return ids.filter((id) => {
    const created = createdFromId(id);
    return created !== null && created >= start;
  }).length;
}
