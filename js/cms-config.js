/**
 * Google Apps Script connection for NAF.
 * AUTH_URL / WEB_APP_URL: screening login + inquire form.
 * Page copy still comes from HTML (cms.js is not loaded on pages).
 */
window.NAF_CMS_CONFIG = {
  WEB_APP_URL:
    "https://script.google.com/macros/s/AKfycbzxflmPdifREqT7Ffrxg_KeofOTNsI_m3EPpuf3y2SvUgGOMQm8mGUvMh2YnDf-tLGdZw/exec",
  AUTH_URL:
    "https://script.google.com/macros/s/AKfycbzxflmPdifREqT7Ffrxg_KeofOTNsI_m3EPpuf3y2SvUgGOMQm8mGUvMh2YnDf-tLGdZw/exec",
  CACHE_MINUTES: 5,
  DEBUG: false
};
