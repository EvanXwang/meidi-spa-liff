export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 rounded-full border-4 border-amber-200 border-t-amber-600 animate-spin" />
    </div>
  );
}
