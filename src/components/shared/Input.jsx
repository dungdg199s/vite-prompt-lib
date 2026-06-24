const inputClassName =
  "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-teal-700 focus:ring-2 focus:ring-teal-200";

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
export default function Input({ label, type, value, options, noneLabel, onChange, ...props }) {
  if (type === "text") {
    return (
      <label className="grid gap-1.5 text-sm">
        <span>
          {props.required ? <span style={{ color: "red" }}>*</span> : null} {label}
        </span>
        <input
          className={inputClassName}
          value={value}
          onChange={(e) => onChange(e)}
          // disabled={editMode === "edit"}
          {...props}
        />
      </label>
    );
  }
  if (type === "select") {
    return (
      <label className="grid gap-1.5 text-sm">
        <span>
          {props.required ? <span style={{ color: "red" }}>*</span> : null} {label}
        </span>
        <select className={inputClassName} value={value} onChange={(e) => onChange(e)}>
          {noneLabel ? <option value="">${noneLabel}</option> : <option value="">--None--</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="grid gap-1.5 text-sm">
        <span>
          {props.required ? <span style={{ color: "red" }}>*</span> : null} {label}
        </span>
        <textarea className={inputClassName} value={value} onChange={(e) => onChange(e)} {...props} />
      </label>
    );
  }
}
