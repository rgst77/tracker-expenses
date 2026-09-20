interface Props {
  size?: number;
}

/** Ascending bars on the app's own gradient — the logo is the product's own chart, in miniature. */
export function Logo({ size = 36 }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" role="img" aria-label="Expenses Tracker">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--series-1)" />
          <stop offset="1" stopColor="var(--series-6)" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="9" fill="url(#logo-grad)" />
      <rect x="9" y="20" width="4.5" height="9" rx="1.5" fill="white" fillOpacity="0.95" />
      <rect x="15.75" y="14" width="4.5" height="15" rx="1.5" fill="white" fillOpacity="0.95" />
      <rect x="22.5" y="8" width="4.5" height="21" rx="1.5" fill="white" />
    </svg>
  );
}
