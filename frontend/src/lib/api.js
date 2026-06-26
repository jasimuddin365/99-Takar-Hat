// api — axios instance configured to talk to the backend through Vite's
// `/api` proxy in dev and same-origin in production. Adds a global error
// interceptor that surfaces a friendly message via react-hot-toast for
// mutations so users get immediate feedback even if the calling page
// forgets to handle the rejection.
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Build a single human-readable message.
    let message = 'Network error — is the backend running on :5000?';
    if (err.response) {
      message =
        err.response.data?.message ||
        err.response.data?.error ||
        `Request failed (${err.response.status})`;
    } else if (err.message && err.message !== 'Network Error') {
      message = err.message;
    }

    // Attach for any handler that wants to inspect it.
    err.userMessage = message;

    // Don't toast on GETs — pages render an <ApiError> panel instead.
    const method = (err.config?.method || 'get').toLowerCase();
    if (method !== 'get' && method !== 'head' && err.response) {
      toast.error(message);
    }

    return Promise.reject(err);
  }
);

export default api;