/** Append ?debug to the URL to show developer tools (reader details, data lab). */
export const DEBUG = typeof location !== 'undefined' && new URLSearchParams(location.search).has('debug');
