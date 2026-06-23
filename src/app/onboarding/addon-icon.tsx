/** Small monochrome icon for an add-on, keyed by the catalog's `icon` hint. */

const PATHS: Record<string, string[]> = {
  dollar: ["M12 2v20", "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"],
  bus: [
    "M4 4h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z",
    "M3 11h18",
  ],
  book: [
    "M12 7v14",
    "M3 18a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3Z",
  ],
  clipboard: [
    "M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z",
    "M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2",
    "M9 12h6",
    "M9 16h4",
  ],
  bed: ["M3 7v12", "M3 11h16a2 2 0 0 1 2 2v6", "M3 17h18", "M7 11V9h5v2"],
  message: ["M21 14a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"],
  default: ["M12 8v8", "M8 12h8", "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18Z"],
};

export function AddonIcon({ icon, className = "" }: { icon: string; className?: string }) {
  const paths = PATHS[icon] ?? PATHS.default;
  return (
    <svg
      className={`h-5 w-5 ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
