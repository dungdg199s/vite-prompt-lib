const secondaryButtonClassName =
  "rounded-lg border border-stone-300 bg-teal-50 px-3 py-2 text-sm font-medium text-slate-800 transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50";
const primaryButtonClassName =
  "rounded-lg border border-teal-800 bg-teal-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50";

/**
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'} variant
 * @property {Function} onClick
 */

/**
 *
 * @param {ButtonProps} props
 * @returns
 */
export default function Button({ variant, className, onClick, children, ...props }) {
  let btnClassName = className || "";
  if (variant === "secondary") {
    btnClassName += " " + secondaryButtonClassName;
  } else if (variant === "primary") {
    btnClassName += " " + primaryButtonClassName;
  }

  return (
    <button type="button" className={btnClassName} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
