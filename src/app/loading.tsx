export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        {/* Logo placeholder */}
        <div className="mx-auto mb-6 w-16 h-16 rounded-full bg-[#1a3358]/10 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-[#1a3358] animate-pulse"
            fill="none"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Loading bar */}
        <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden">
          <div className="h-full bg-[#c9a84c] rounded-full animate-[loading_1.5s_ease-in-out_infinite]" />
        </div>

        {/* Text */}
        <p className="mt-4 text-sm text-slate-400 font-medium">Loading Infinity Legal...</p>
      </div>
    </div>
  );
}
