import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 24, ...rest }: IconProps): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    'aria-hidden': true,
    focusable: false,
    ...rest,
  };
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const;

export const ChatsIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor">
    <path
      fillRule="evenodd"
      d="M5.5 3.5h13a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3h-5.6l-4.3 3.3c-.7.5-1.6 0-1.6-.8V18h-1.5a3 3 0 0 1-3-3V6.5a3 3 0 0 1 3-3ZM8 9.4a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm4 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Zm4 0a1.35 1.35 0 1 0 0 2.7 1.35 1.35 0 0 0 0-2.7Z"
    />
  </svg>
);

export const SettingsIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor">
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.47.47 0 0 0-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.48.48 0 0 0-.12-.61l-2.01-1.58ZM12 15.6a3.6 3.6 0 1 1 0-7.2 3.6 3.6 0 0 1 0 7.2Z" />
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ArrowLeftIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke}>
    <path d="M20 12H4.5M10.5 5.5 4 12l6.5 6.5" />
  </svg>
);

export const ArrowDownIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke}>
    <path d="M12 5v14M5.5 12.5 12 19l6.5-6.5" />
  </svg>
);

export const SendIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={2.2}>
    <path d="M12 19V5.5M5.5 11.5 12 5l6.5 6.5" />
  </svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const CheckIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M4.5 12.5 9 17 19.5 6.5" />
  </svg>
);

export const DoubleCheckIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M1.5 12.5 6 17 16.5 6.5M11 16.2l.8.8L22.3 6.5" />
  </svg>
);

export const ClockIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 7.5V12l3 2" />
  </svg>
);

export const AlertIcon = (p: IconProps) => (
  <svg {...base(p)} fill="currentColor">
    <path
      fillRule="evenodd"
      d="M12 2.5a9.5 9.5 0 1 1 0 19 9.5 9.5 0 0 1 0-19Zm0 4.5a1.1 1.1 0 0 0-1.1 1.1v4.8a1.1 1.1 0 0 0 2.2 0V8.1A1.1 1.1 0 0 0 12 7Zm0 8.2a1.3 1.3 0 1 0 0 2.6 1.3 1.3 0 0 0 0-2.6Z"
    />
  </svg>
);

export const SearchIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
);

export const EyeIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M10.6 5.6A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.5 7.1C3.9 8.8 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1.1M9.9 9.9a3 3 0 0 0 4.2 4.2M3 3l18 18" />
  </svg>
);

export const LogoutIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14M10 16.5 5.5 12 10 7.5M5.5 12H15" />
  </svg>
);

export const BellOffIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M9.5 20a2.6 2.6 0 0 0 5 0M18 13.5V10a6 6 0 0 0-9.4-4.9M6.2 8.5A6 6 0 0 0 6 10v4l-2 3h13M3 3l18 18" />
  </svg>
);

export const LinkOffIcon = (p: IconProps) => (
  <svg {...base(p)} {...stroke} strokeWidth={1.8}>
    <path d="M9 17H7A5 5 0 0 1 7 7h2M15 7h2a5 5 0 0 1 4 8M8 12h4M3 3l18 18" />
  </svg>
);
