import { useEffect } from "react";

const sizeClassMap = {
  md: "max-w-md",
  lg: "max-w-2xl",
};

export default function AppModal({
  isOpen,
  title,
  onClose,
  children,
  size = "md",
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full rounded-2xl border border-stone-300 bg-[#fffef8] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${sizeClassMap[size] || sizeClassMap.md}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {children}
      </div>
    </div>
  );
}
