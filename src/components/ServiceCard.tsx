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
    <Card className="flex flex-col gap-3">
      {/* Image / themed fallback */}
      {service.image_url ? (
        <img
          src={service.image_url}
          alt={service.name}
          className="w-20 h-20 rounded-lg object-cover"
        />
      ) : (
        <div
          className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center text-white font-bold text-2xl select-none shadow-sm"
          aria-hidden="true"
        >
          {service.name.charAt(0)}
        </div>
      )}

      {/* Name */}
      <p className="font-bold text-gray-800">{service.name}</p>

      {/* Duration + price */}
      <p className="text-sm text-amber-700 font-medium">
        {service.duration} 分鐘 &bull; NT${service.price.toLocaleString()}
      </p>

      {/* Description */}
      {service.description && (
        <p className="text-sm text-gray-500 line-clamp-2">{service.description}</p>
      )}

      {/* CTA */}
      {onBook && (
        <Button
          variant="primary"
          onClick={() => onBook(service)}
          className="self-start mt-1"
        >
          立即預約 →
        </Button>
      )}
    </Card>
  );
}
