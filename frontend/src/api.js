let csrf = '';
export function setCsrf(value) { csrf = value || ''; }
export async function api(path, options = {}) {
  const headers = { ...options.headers };
  const method = options.method || 'GET';
  if (!(options.body instanceof FormData) && options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }
  if (!['GET', 'HEAD'].includes(method.toUpperCase()) && csrf) {
    headers['X-CSRF-Token'] = csrf;
  }
  const response = await fetch('/api' + path, { ...options, method, credentials: 'same-origin', headers });
  let payload = null;
  try { payload = await response.json(); } catch {}
  if (!response.ok) {
    const detail = payload && payload.detail;
    throw new Error(typeof detail === 'string' ? detail : 'در ارتباط با سرور مشکلی رخ داده است');
  }
  return payload;
}
