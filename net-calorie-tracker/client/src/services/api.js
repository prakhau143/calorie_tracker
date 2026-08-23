const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

async function request(path, { method = 'GET', body, headers } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || `Request failed with status ${res.status}`);
  }

  return json.data;
}

function toQueryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, value);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const api = {
  listUsers: () => request('/users'),
  createUser: (body) => request('/users', { method: 'POST', body }),
  getUser: (userId) => request(`/users/${userId}`),
  deleteUser: (userId) => request(`/users/${userId}`, { method: 'DELETE' }),

  searchFoods: (params) => request(`/foods${toQueryString(params)}`),
  searchActivities: (params) => request(`/activities${toQueryString(params)}`),

  getDay: (userId, date) => request(`/users/${userId}/days/${date}`),
  saveDay: (userId, date, body) => request(`/users/${userId}/days/${date}`, { method: 'PUT', body }),
};
