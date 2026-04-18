'use client';

import { Service } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Props {
  service: Service;
  onBook?: (service: Service) => void;
}

export function ServiceCard({ service, onBook }: Props) {
  return (
    <Card className="flex flex-row gap-4 items-stretch">
      {/* Left: text content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <p className="font-bold text-gray-800 text-base leading-snug">{service.name}</p>
        <p className="text-sm text-amber-700 font-medium">
          {service.duration} 分鐘 &bull; NT${service.price.toLocaleString()}
        </p>
        {service.description && (
          <p className="text-sm text-gray-500 line-clamp-3">{service.description}</p>
        )}
        {onBook && (
          <Button
            variant="primary"
            onClick={() => onBook(service)}
            className="self-start mt-auto"
          >
            立即預約 →
          </Button>
        )}
      </div>

      {/* Right: larger image / themed fallback */}
      <div className="w-36 flex-shrink-0">
        {service.image_url ? (
          <img
            src={service.image_url}
            alt={service.name}
            className="w-36 h-full min-h-36 rounded-lg object-cover"
          />
        ) : (
          <div
            className="w-36 h-full min-h-36 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-bold text-3xl select-none shadow-sm"
            aria-hidden="true"
          >
            {service.name.charAt(0)}
          </div>
        )}
      </div>
    </Card>
  );
}
