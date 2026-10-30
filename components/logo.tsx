import Link from 'next/link';

export function LogoMark({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 1254 1254" role="img" aria-label="NGD">
      <g fill="currentColor">
        <path d="M154 500 L238 433 L322 638 L322 368 L410 300 L410 985 L348 940 L238 680 L238 866 L154 803 Z" />
        <path d="M626 131 L792 261 L792 435 L707 435 L707 298 L626 237 L545 299 L545 950 L626 1011 L707 950 L707 687 L610 687 L610 607 L792 607 L792 1015 L626 1128 L460 1015 L460 261 Z" />
        <path fillRule="evenodd" d="M843 298 L1085 495 L1085 803 L843 990 Z M928 500 L989 550 L989 745 L928 791 Z" />
      </g>
    </svg>
  );
}

export function Logo({ linked = true }: { linked?: boolean }) {
  const content = (
    <span className="logo-lockup">
      <span className="logo-mark-wrap"><LogoMark className="logo-mark" /></span>
      <span className="logo-type">
        <strong>NGD</strong>
        <span>NextGenDev Solutions</span>
      </span>
    </span>
  );

  return linked ? <Link href="/" aria-label="NGD Solutions home">{content}</Link> : content;
}
