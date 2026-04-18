'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/src/style.css';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Booking, Service, Therapist } from '@/types';
import { ServiceCard } from '@/components/ServiceCard';
import { TherapistAvatar } from '@/components/TherapistAvatar';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function BookingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Data
  const [services, setServices] = useState<Service[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [therapistError, setTherapistError] = useState<string | null>(null);

  // Selections
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Load services
  useEffect(() => {
    apiFetch<Service[]>('/api/services')
      .then((data) => {
        setServices(data);
        // Pre-select service from query param
        const serviceId = searchParams.get('serviceId');
        if (serviceId) {
          const found = data.find((s) => s.id === serviceId) ?? null;
          if (found) {
            setSelectedService(found);
            setStep(2);
          }
        }
      })
      .catch((e: Error) => setServiceError(e.message))
      .finally(() => setLoadingServices(false));
  }, [searchParams]);

  // Load therapists
  useEffect(() => {
    apiFetch<Therapist[]>('/api/therapists')
      .then((data) => setTherapists(data))
      .catch((e: Error) => setTherapistError(e.message))
      .finally(() => setLoadingTherapists(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Step 1: Choose service ──────────────────────────────────────────────
  if (step === 1) {
    return (
      <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
        {/* Back link */}
        <div className="pt-4 pb-2">
          <Link href="/dashboard" className="text-amber-700 font-medium flex items-center gap-1">
            ← 返回
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-amber-700 mb-2">預約療程</h1>
        <p className="text-sm text-gray-500 mb-6">步驟 1 / 3 — 選擇療程</p>

        {loadingServices && <LoadingSpinner />}
        {serviceError && (
          <p className="text-red-500">載入失敗：{serviceError}</p>
        )}
        {!loadingServices && !serviceError && (
          <div className="flex flex-col gap-4">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={(s) => {
                  setSelectedService(s);
                  setStep(2);
                }}
              />
            ))}
            {services.length === 0 && (
              <p className="text-gray-500">目前尚無療程服務。</p>
            )}
          </div>
        )}
      </main>
    );
  }

  // ── Step 2: Choose date + therapist ────────────────────────────────────
  if (step === 2) {
    return (
      <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-amber-700 mb-2 pt-4">預約療程</h1>
        <p className="text-sm text-gray-500 mb-6">步驟 2 / 3 — 選擇日期與治療師</p>

        {/* Selected service summary */}
        {selectedService && (
          <div className="mb-5 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-sm font-medium text-amber-800">
              {selectedService.name} &bull; {selectedService.duration} 分鐘 &bull; NT${selectedService.price.toLocaleString()}
            </p>
          </div>
        )}

        {/* Date picker */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">選擇日期</h2>
          <div className="inline-block border border-gray-200 rounded-xl overflow-hidden">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                setSelectedDate(date);
                setSelectedTime(null);
              }}
              disabled={{ before: today }}
              locale={zhTW}
            />
          </div>
        </section>

        {/* Time slot picker — shown once a date is selected */}
        {selectedDate && (
          <section className="mb-6">
            <h2 className="text-base font-semibold text-gray-700 mb-3">
              選擇時段（{format(selectedDate, 'MM/dd')}）
            </h2>
            <TimeSlotPicker
              date={selectedDate}
              selectedTime={selectedTime}
              onSelect={setSelectedTime}
            />
          </section>
        )}

        {/* Therapist picker */}
        <section className="mb-6">
          <h2 className="text-base font-semibold text-gray-700 mb-3">
            選擇治療師
            <span className="text-xs text-gray-400 font-normal ml-2">（可略過）</span>
          </h2>

          {loadingTherapists && <LoadingSpinner />}
          {therapistError && (
            <p className="text-red-500 text-sm">載入失敗：{therapistError}</p>
          )}
          {!loadingTherapists && !therapistError && (
            <div className="flex gap-4 flex-wrap">
              {therapists.map((t) => (
                <TherapistAvatar
                  key={t.id}
                  therapist={t}
                  selected={selectedTherapist?.id === t.id}
                  onClick={(therapist) =>
                    setSelectedTherapist(
                      selectedTherapist?.id === therapist.id ? null : therapist
                    )
                  }
                />
              ))}
              {therapists.length === 0 && (
                <p className="text-sm text-gray-500">目前無治療師資料。</p>
              )}
            </div>
          )}
        </section>

        {/* Navigation */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedService(null);
              setSelectedDate(undefined);
              setSelectedTime(null);
              setSelectedTherapist(null);
              setStep(1);
            }}
          >
            上一步
          </Button>
          <Button
            variant="primary"
            disabled={!selectedDate || !selectedTime}
            onClick={() => setStep(3)}
          >
            下一步
          </Button>
        </div>
      </main>
    );
  }

  // ── Step 3: Confirm ─────────────────────────────────────────────────────
  const formattedDate = selectedDate
    ? format(selectedDate, 'yyyy 年 M 月 d 日', { locale: zhTW })
    : '';

  return (
    <main className="min-h-screen bg-amber-50 p-4 pb-24 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-amber-700 mb-2 pt-4">預約療程</h1>
      <p className="text-sm text-gray-500 mb-6">步驟 3 / 3 — 確認預約</p>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6 flex flex-col gap-3 shadow-sm">
        <Row label="療程" value={selectedService?.name ?? '—'} />
        <Row label="日期" value={formattedDate} />
        <Row label="時段" value={selectedTime ?? '—'} />
        <Row
          label="治療師"
          value={selectedTherapist ? selectedTherapist.name : '不指定'}
        />
        {selectedService && (
          <Row
            label="費用"
            value={`NT$${selectedService.price.toLocaleString()}`}
          />
        )}
      </div>

      {submitError && (
        <p className="text-red-500 text-sm mb-4">{submitError}</p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setStep(2)} disabled={submitting}>
          上一步
        </Button>
        <Button
          variant="primary"
          disabled={submitting}
          onClick={async () => {
            setSubmitError(null);
            setSubmitting(true);
            try {
              await apiFetch<{ booking: Booking }>('/api/bookings', {
                method: 'POST',
                body: JSON.stringify({
                  serviceId: selectedService!.id,
                  therapistId: selectedTherapist?.id ?? null,
                  date: format(selectedDate!, 'yyyy-MM-dd'),
                  time: selectedTime!,
                }),
              });
              router.push('/dashboard');
            } catch (e: unknown) {
              setSubmitError(e instanceof Error ? e.message : '預約失敗，請再試一次');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {submitting ? '處理中…' : '確認預約'}
        </Button>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-800">{value}</span>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <BookingInner />
    </Suspense>
  );
}
