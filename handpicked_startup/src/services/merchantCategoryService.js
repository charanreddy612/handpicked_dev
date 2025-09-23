// src/services/merchantCategoryService.js
import axios from "axios";

import { API_BASE_URL } from "../config/api";

const http = axios.create({
  baseURL: `${API_BASE_URL}/api`, // matches your other services
  withCredentials: true,
});

// Helper to extract a consistent error message
function normErr(err, resData) {
  // prefer server-provided message shape
  const serverMsg =
    resData?.error?.message || err?.response?.data?.error?.message;
  return { message: serverMsg || err?.message || "Request failed" };
}

// List
export async function listMerchantCategories(params = {}) {
  try {
    const qp = new URLSearchParams();
    const {
      name = "",
      show_home,
      show_deals_page,
      is_publish,
      is_header,
      page = 1,
      limit = 20,
      include_store_count,
    } = params;
    if (name) qp.set("name", name);
    if (show_home !== undefined) qp.set("show_home", String(!!show_home));
    if (show_deals_page !== undefined)
      qp.set("show_deals_page", String(!!show_deals_page));
    if (is_publish !== undefined) qp.set("is_publish", String(!!is_publish));
    if (is_header !== undefined) qp.set("is_header", String(!!is_header));
    if (include_store_count) qp.set("include_store_count", "true"); // <-- used in Step 4
    qp.set("page", String(page));
    qp.set("limit", String(limit));

    const res = await http.get(`/merchant-categories?${qp.toString()}`);
    return {
      data: Array.isArray(res.data?.data?.rows) ? res.data.data.rows : [],
      total: Number(res.data?.data?.total || 0),
      error: res.data?.error || null,
    };
  } catch (err) {
    return { data: [], total: 0, error: normErr(err, err?.response?.data) };
  }
}

// Detail
export async function getMerchantCategory(id) {
  try {
    const res = await http.get(`/merchant-categories/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return null;
  }
}

// Create
export async function addMerchantCategory(formData) {
  try {
    const res = await http.post(`/merchant-categories`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: normErr(err, err?.response?.data) };
  }
}

// Update
export async function updateMerchantCategory(id, formData) {
  try {
    const res = await http.put(`/merchant-categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: normErr(err, err?.response?.data) };
  }
}

// Toggle
export async function toggleMerchantCategoryStatus(id) {
  try {
    const res = await http.patch(`/merchant-categories/${id}/status`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: normErr(err, err?.response?.data) };
  }
}

// Delete
export async function removeMerchantCategory(id) {
  try {
    const res = await http.delete(`/merchant-categories/${id}`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: normErr(err, err?.response?.data) };
  }
}

// src/services/merchantCategoryService.js
export async function getAllCategories() {
  try {
    const res = await fetch(`/api/merchant-categories?limit=1000`);
    if (!res.ok) throw new Error("Failed to fetch categories");
    const data = await res.json();

    // normalize possible response shapes:
    // { items: [...] } | { data: { rows: [...] } } | [...]
    const raw =
      (data && data.items) ||
      (data && data.data && (data.data.rows || data.data.items)) ||
      (data && data.data) ||
      data ||
      [];

    const arr = Array.isArray(raw) ? raw : [];

    return arr.map((cat) => ({
      id: cat.id ?? cat._id ?? cat.id_string ?? null,
      name: cat.name ?? cat.category_name ?? String(cat.id ?? cat._id ?? ""),
    }));
  } catch (err) {
    console.error("Error in getAllCategories:", err);
    return [];
  }
}
