/**
 * Application Configuration
 *
 * This file manages app-level configuration that can be overridden
 * via URL parameters or environment variables
 */

const isNode = typeof window === "undefined";
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {},
) => {
  if (isNode) {
    return defaultValue;
  }
  const storageKey = `autopro_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  const storedValue = storage.getItem(storageKey);
  if (storedValue) {
    return storedValue;
  }
  return null;
};

const getAppParams = () => {
  return {
    apiBaseUrl: getAppParamValue("api_base_url", {
      defaultValue: import.meta.env.VITE_API_BASE_URL,
    }),
    appName: getAppParamValue("app_name", {
      defaultValue: import.meta.env.VITE_APP_NAME || "Auto Pro Tech",
    }),
    appVersion: getAppParamValue("app_version", {
      defaultValue: import.meta.env.VITE_APP_VERSION || "1.0.0",
    }),
  };
};

export const appParams = {
  ...getAppParams(),
};
