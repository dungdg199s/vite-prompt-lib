import {  useNavigate } from "react-router-dom";

/**
 * @typedef {Object} AppNavigateOptions
 * @property {string} object
 * @property {string} recordId
 * @property {string} action
 * @property {Object} [options]
 */

export function useAppNavigate() {
  const navigate = useNavigate();

  /**
   * @param {AppNavigateOptions} appNavigateOptions
   * @returns {void}
   */
  const appNavigate = ({ object, recordId, action, options = {} }) => {
    const { replace = false } = options;
    const path = ["/", object, recordId, action].filter(Boolean).join("/");
    return navigate(path, { ...options, replace });
  };

  return appNavigate;
}
