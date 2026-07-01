import { useEffect } from "react";
import Button from "./Button";

const sizeClassMap = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

const Header = ({ children }) => {
  return <>{children}</>;
};
const Actions = ({ children }) => {
  return <>{children}</>;
};
const Content = ({ children }) => {
  return <>{children}</>;
};

export default function Modal({ isOpen, title, helptext, onClose, onSubmit, children, size = "md" }) {
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

  const childrenArray = [].concat(children).filter(Boolean);
  const headerSlot = childrenArray.find((child) => child.type === Header);
  const contentSlot = childrenArray.filter((child) => child.type === Content);
  const actionSlot = childrenArray.find((child) => child.type === Actions);

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
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl border border-stone-300 bg-[#fffef8] p-5 shadow-[0_24px_60px_rgba(15,23,42,0.25)] ${sizeClassMap[size] || sizeClassMap.md}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {headerSlot || (
          <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
              <p className="text-xs uppercase tracking-wider text-slate-500">{helptext}</p>
            </div>
            <Button type="button" variant="secondary" onClick={onClose}>
              🗙
            </Button>
          </div>
        )}

        <form onSubmit={(e) => onSubmit && onSubmit(e)}>
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">{contentSlot}</div>

          {actionSlot && (
            <div className="sticky bottom-0 mt-3 flex shrink-0 flex-wrap justify-end gap-2 border-t border-stone-200 bg-[#fffef8] pt-3">
              {actionSlot}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

Modal.Header = Header;
Modal.Actions = Actions;
Modal.Content = Content;
