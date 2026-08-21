export function StatusToast({ title, description }: { title: string; description: string }) {
  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-xs rounded-lg border border-[#e8e2e0] bg-white px-4 py-3 text-sm shadow-lg" role="status" aria-live="polite">
      <p className="font-semibold text-grad-ink">{title}</p>
      <p className="mt-1 text-xs text-neutral-500">{description}</p>
    </div>
  );
}
