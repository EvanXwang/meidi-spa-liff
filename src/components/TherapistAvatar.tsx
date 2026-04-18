'use client';

import { Therapist } from '@/types';

interface Props {
  therapist: Therapist;
  selected?: boolean;
  onClick?: (therapist: Therapist) => void;
}

export function TherapistAvatar({ therapist, selected, onClick }: Props) {
  const initial = therapist.name.charAt(0);

  const handleClick = onClick ? () => onClick(therapist) : undefined;

  return (
    <div
      className={`flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(therapist);
            }
          : undefined
      }
    >
      {/* Avatar circle */}
      <div
        className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center ${
          selected ? 'ring-2 ring-amber-500 ring-offset-1' : ''
        }`}
      >
        {therapist.picture_url ? (
          <img
            src={therapist.picture_url}
            alt={therapist.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-amber-400 flex items-center justify-center text-white font-bold text-lg select-none">
            {initial}
          </div>
        )}
      </div>

      {/* Name */}
      <span className="text-xs font-medium text-gray-800 text-center leading-tight">
        {therapist.name}
      </span>

      {/* Title */}
      {therapist.title && (
        <span className="text-xs text-gray-500 text-center leading-tight">
          {therapist.title}
        </span>
      )}
    </div>
  );
}
