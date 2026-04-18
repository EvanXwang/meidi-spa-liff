'use client';

interface Props {
  date: Date;
  selectedTime: string | null; // "HH:MM" format
  onSelect: (time: string) => void;
}

const TIME_SLOTS = [
  '10:00',
  '11:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
];

export function TimeSlotPicker({ date: _date, selectedTime, onSelect }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="選擇時段">
      {TIME_SLOTS.map((slot) => {
        const isSelected = slot === selectedTime;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              isSelected
                ? 'bg-amber-500 text-white'
                : 'border border-amber-500 text-amber-700 hover:bg-amber-50'
            }`}
            aria-pressed={isSelected}
          >
            {slot}
          </button>
        );
      })}
    </div>
  );
}
