// src/services/merchantService.js
import http from "./http"; // adjust path if your http client lives elsewhere

// List with filters + pagination
export async function listMerchants({ name = "", page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    params.set("page", String(page));
    params.set("limit", String(limit));
    const res = await http.get(`/merchants?${params.toString()}`);
    return {
      data: Array.isArray(res.data?.data?.rows) ? res.data.data.rows : [],
      total: Number(res.data?.data?.total || 0),
      error: res.data?.error || null,
    };
  } catch (err) {
    return { data: [], total: 0, error: { message: err.message } };
  }
}

// Detail
export async function getMerchant(id) {
  try {
    const res = await http.get(`/merchants/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return null;
  }
}

// Create (multipart)
export async function addMerchant(formData) {
  try {
    const res = await http.post(`/merchants`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Update (multipart)
export async function updateMerchant(id, formData) {
  try {
    const res = await http.put(`/merchants/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Toggle active/inactive
export async function toggleMerchantStatus(id) {
  try {
    const res = await http.patch(`/merchants/${id}/status`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Delete
export async function removeMerchant(id) {
  try {
    const res = await http.delete(`/merchants/${id}`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}