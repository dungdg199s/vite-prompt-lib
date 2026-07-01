import { buttonClassByVariant, buttonSizeClass, cx } from "./uiClasses";

/**
 * @typedef {Object} ButtonProps
 * @property {'primary'|'secondary'|'danger'|'ghost'|'icon'} variant
 * @property {Function} onClick
 */

/**
 *
 * @param {ButtonProps} props
 * @returns
 */
export default function Button({
  variant = "secondary",
  size = "md",
  className,
  onClick,
  fullWidth = false,
  children,
  ...props
}) {
  const btnClassName = cx(
    buttonClassByVariant[variant] || buttonClassByVariant.secondary,
    size === "md" ? "" : buttonSizeClass[size],
    fullWidth ? "w-full" : "",
    className
  );

  return (
    <button type="button" className={btnClassName} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
