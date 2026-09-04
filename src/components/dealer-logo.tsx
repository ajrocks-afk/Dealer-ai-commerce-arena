import type { SVGProps } from "react";

interface DealerLogoProps extends SVGProps<SVGSVGElement> {
  size?: number;
  showWordmark?: boolean;
}

export function DealerLogo({
  size = 32,
  showWordmark = true,
  className,
  ...props
}: DealerLogoProps) {
  return (
    <div
      className={`flex items-center gap-2.5 ${className ?? ""}`}
      aria-label="DEALER"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
      >
        <defs>
          <linearGradient
            id="dealerGold"
            x1="8"
            y1="8"
            x2="58"
            y2="58"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor="#F7D9A0" />
            <stop offset="0.42" stopColor="#F5A623" />
            <stop offset="1" stopColor="#9A681E" />
          </linearGradient>
        </defs>

        {/* Outer D */}
        <path
          d="
            M13 8
            H31
            C47 8 58 19 58 32
            C58 45 47 56 31 56
            H13
            V8
            Z

            M22 17
            V47
            H31
            C41 47 49 41 49 32
            C49 23 41 17 31 17
            H22
            Z
          "
          fill="url(#dealerGold)"
          fillRule="evenodd"
        />

        {/* Inner vertical D stroke */}
        <path
          d="M13 8H22V56H13V8Z"
          fill="url(#dealerGold)"
        />

        {/* Inner horizontal accent */}
        <path
          d="M22 27H34C37.8 27 40.5 29 40.5 32C40.5 35 37.8 37 34 37H22V27Z"
          fill="url(#dealerGold)"
        />
      </svg>

      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-[13px] font-bold tracking-[0.18em] text-white">
            DEALER
          </span>

          <span className="mt-1 text-[7px] font-medium tracking-[0.18em] text-zinc-500">
            AI COMMERCE
          </span>
        </div>
      )}
    </div>
  );
}