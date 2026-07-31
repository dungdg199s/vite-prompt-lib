import { cx, uiClasses } from "./uiClasses";

/**
 * @typedef {Object} InputProps
 * @property {'text'|'select'} type
 * @property {Function} onChange
 */

/**
 *
 * @param {InputProps} props
 * @returns
 */
export default function Input({
  label,
  type = "text",
  value,
  options = [],
  noneLabel,
  hint,
  error,
  className,
  onChange,
  ...props
}) {
  const inputClassName = cx(
    uiClasses.input,
    className,
    error ? "border-red-500 focus:border-red-600 focus:ring-red-200" : ""
  );

  if (type === "text") {
    return (
      <label className={uiClasses.label}>
        <span className="font-medium text-slate-700">
          {props.required ? <span className="text-red-600">*</span> : null} {label}
        </span>
        <input className={inputClassName} value={value} onChange={(e) => onChange(e)} {...props} />
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        {error ? <span className="text-xs text-red-700">{error}</span> : null}
      </label>
    );
  }
  if (type === "select") {
    return (
      <label className={uiClasses.label}>
        <span className="font-medium text-slate-700">
          {props.required ? <span className="text-red-600">*</span> : null} {label}
        </span>
        <select className={inputClassName} value={value} onChange={(e) => onChange(e)}>
          {props.required !== true && noneLabel ? <option value="">{noneLabel}</option> : null}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        {error ? <span className="text-xs text-red-700">{error}</span> : null}
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className={uiClasses.label}>
        <span className="font-medium text-slate-700">
          {props.required ? <span className="text-red-600">*</span> : null} {label}
        </span>
        <textarea className={inputClassName} value={value} onChange={(e) => onChange(e)} {...props} />
        {hint ? <span className="text-xs text-slate-500">{hint}</span> : null}
        {error ? <span className="text-xs text-red-700">{error}</span> : null}
      </label>
    );
  }

  return null;
}
