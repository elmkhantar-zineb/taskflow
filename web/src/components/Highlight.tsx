type HighlightProps = {
  text: string;
  query: string;
};

export function Highlight({ text, query }: HighlightProps) {
  const needle = query.trim();
  if (!needle) return text;

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "ig"));
  const lower = needle.toLowerCase();

  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === lower ? (
          <mark key={index}>{part}</mark>
        ) : (
          <span key={index}>{part}</span>
        ),
      )}
    </>
  );
}
