// Central API config — all requests go through here
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const authApi = {
  signup: (name, email, password) =>
    request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  me: () => request('/api/auth/me'),
};

export const productsApi = {
  getAll: () => request('/api/products'),
  getOne: (id) => request(`/api/products/${id}`),
};

export const cartApi = {
  get: () => request('/api/cart'),
  add: (productId, quantity = 1) =>
    request('/api/cart/add', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    }),
  update: (productId, quantity) =>
    request('/api/cart/update', {
      method: 'PUT',
      body: JSON.stringify({ productId, quantity }),
    }),
  remove: (productId) =>
    request(`/api/cart/remove/${productId}`, { method: 'DELETE' }),
};

export const ordersApi = {
  create: (shippingAddress) =>
    request('/api/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress }),
    }),
  getAll: () => request('/api/orders'),
};
