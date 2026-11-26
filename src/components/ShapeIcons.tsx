import React from 'react';

interface IconProps {
  className?: string;
}

export const FractionShapeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Friendly arch silhouette inspired by geometric character elements */}
    <path
      d="M4 16C4 9.37258 9.37258 4 16 4C22.6274 4 28 9.37258 28 16V23C28 25.7614 25.7614 28 23 28H9C6.23858 28 4 25.7614 4 23V16Z"
      fill="#DBEAFE"
    />
    <circle cx="12" cy="15.5" r="1.6" fill="#1E3A8A" />
    <circle cx="20" cy="15.5" r="1.6" fill="#1E3A8A" />
    <path
      d="M12.5 20C13.6 21.3 18.4 21.3 19.5 20"
      stroke="#1E3A8A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const DecimalShapeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Friendly circle silhouette */}
    <circle cx="16" cy="16" r="12" fill="#E0F2FE" />
    <circle cx="12" cy="14.5" r="1.6" fill="#0F294A" />
    <circle cx="20" cy="14.5" r="1.6" fill="#0F294A" />
    <path
      d="M12.8 19.2C14.1 20.5 17.9 20.5 19.2 19.2"
      stroke="#0F294A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

export const PercentShapeIcon: React.FC<IconProps> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Friendly rounded clover/badge silhouette */}
    <rect x="4" y="4" width="24" height="24" rx="8" fill="#E0E7FF" />
    <circle cx="12" cy="15" r="1.6" fill="#1E3A8A" />
    <circle cx="20" cy="15" r="1.6" fill="#1E3A8A" />
    <path
      d="M12.5 19.5C13.8 20.8 18.2 20.8 19.5 19.5"
      stroke="#1E3A8A"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);
