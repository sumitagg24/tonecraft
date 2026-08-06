import * as React from "react";

export default function Gemini({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <path
        d="M12 24c0-2.21-.39-4.34-1.1-6.3l-.06.08c-4.05 1.87-6.84 5.66-6.84 10.22 0 6.08 4.92 11 11 11h26.84c-.15-.21-.29-.44-.39-.67-.42.39-.9.7-1.45.9 0-.19.01-.37.01-.56 0-6.08-4.92-11-11-11H18c0 .34-.01.66-.01 1 0 6.08 4.92 11 11 11h20c0 6.08-4.92 11-11 11-6.08 0-11-4.92-11-11h-6c0 3.87 3.13 7 7 7 3.87 0 7-3.13 7-7h-26c0-6.08-4.92-11-11-11h-2C5.05 35 9 31.05 9 24z"
        fill="currentColor"
      />
    </svg>
  );
}
