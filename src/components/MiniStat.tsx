'use client';

export function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white/10 rounded-lg px-4 py-2 text-center backdrop-blur-sm">
      <div className="text-lg font-bold text-[#c9a84c]">{value}</div>
      <div className="text-[10px] text-[#8fa4c4]">{label}</div>
    </div>
  );
}
