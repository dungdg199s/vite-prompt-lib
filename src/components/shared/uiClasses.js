export const cx = (...classes) => classes.filter(Boolean).join(" ");

export const uiClasses = {
  pageSurface:
    "min-h-screen bg-[radial-gradient(circle_at_top_right,_#d8ede5,_transparent_45%),radial-gradient(circle_at_bottom_left,_#f5d7b4,_transparent_40%)] bg-[#f4ede1] text-slate-800",
  pageGrid: "mx-auto grid min-h-screen grid-cols-1 md:grid-cols-[320px_1fr]",
  sidebar:
    "border-b border-stone-300/90 bg-[#f8f1e6] p-5 md:border-r md:border-b-0",
  card: "rounded-2xl border border-stone-300 bg-[#fffef8] p-4 shadow-[0_8px_24px_rgba(44,33,12,0.06)] md:p-5",
  mutedCard: "rounded-xl border border-stone-200 bg-[#fffcf7] p-3",
  dashedCard:
    "rounded-xl border border-dashed border-stone-300 bg-[#fffcf7] p-4 text-sm text-slate-600",
  heading: "text-lg font-semibold tracking-tight",
  subtext: "mt-1 text-sm text-slate-600",
  label: "grid gap-1.5 text-sm",
  input:
    "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-slate-500",
  codeBlock:
    "overflow-x-auto rounded-xl border border-stone-200 bg-[#fffcf7] p-3 text-xs text-slate-700 whitespace-pre-wrap break-words",
  darkCodeBlock:
    "overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs text-slate-50 whitespace-pre-wrap break-words",
};

export const buttonClassByVariant = {
  primary:
    "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50",
  secondary:
    "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50",
  danger:
    "rounded-lg border border-red-700 bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50",
  ghost:
    "rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50",
  icon: "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-base font-semibold text-slate-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-50",
};

export const buttonSizeClass = {
  sm: "px-2 py-1 text-xs",
  md: "px-3 py-2 text-sm",
  lg: "px-4 py-2.5 text-sm",
};
