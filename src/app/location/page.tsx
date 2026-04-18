export const metadata = {
  title: '店址 — 美的原點 Spa 仕女館',
};

export default function LocationPage() {
  const address = '702 臺南市南區夏林路 5 號 2 樓';
  const phone = '06-2239328';
  const q = encodeURIComponent('702臺南市南區夏林路5號2樓');
  const embedSrc = `https://maps.google.com/maps?q=${q}&output=embed`;
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${q}`;

  return (
    <main className="min-h-screen bg-amber-50 p-4 max-w-md mx-auto space-y-4">
      <header className="pt-4">
        <h1 className="text-2xl font-bold text-amber-700">店址</h1>
        <p className="text-sm text-gray-500 mt-1">美的原點 Spa 仕女館</p>
      </header>

      <div className="bg-white rounded-xl p-4 shadow-sm space-y-2">
        <p className="text-gray-800 font-medium">{address}</p>
        <a
          href={`tel:${phone.replace(/-/g, '')}`}
          className="text-amber-700 font-medium inline-block"
        >
          {phone}
        </a>
      </div>

      <div className="rounded-xl overflow-hidden shadow-sm bg-white">
        <iframe
          src={embedSrc}
          className="w-full h-80 border-0 block"
          loading="lazy"
          title="美的原點 Spa 仕女館 位置"
          referrerPolicy="no-referrer-when-downgrade"
          allow="fullscreen"
        />
      </div>

      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block text-center w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 rounded-xl shadow-sm"
      >
        用 Google Maps 開啟導航
      </a>

      <a
        href={`tel:${phone.replace(/-/g, '')}`}
        className="block text-center w-full border border-amber-500 text-amber-700 font-medium py-3 rounded-xl"
      >
        撥打 {phone}
      </a>
    </main>
  );
}
