// src/services/merchantCategoryService.js
import axios from "axios";

import { API_BASE_URL } from "../config/api";

const http = axios.create({
  baseURL: `${API_BASE_URL}/api`, // matches your other services
  withCredentials: true,
});

// List with filters + pagination
export async function listMerchantCategories({ name = "", show_home, show_deals_page, is_publish, is_header, page = 1, limit = 20 } = {}) {
  try {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    if (show_home !== undefined) params.set("show_home", String(!!show_home));
    if (show_deals_page !== undefined) params.set("show_deals_page", String(!!show_deals_page));
    if (is_publish !== undefined) params.set("is_publish", String(!!is_publish));
    if (is_header !== undefined) params.set("is_header", String(!!is_header));
    params.set("page", String(page));
    params.set("limit", String(limit));
    const res = await http.get(`/merchant-categories?${params.toString()}`);
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
export async function getMerchantCategory(id) {
  try {
    const res = await http.get(`/merchant-categories/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return null;
  }
}

// Create (multipart)
export async function addMerchantCategory(formData) {
  try {
    const res = await http.post(`/merchant-categories`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Update (multipart)
export async function updateMerchantCategory(id, formData) {
  try {
    const res = await http.put(`/merchant-categories/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Toggle publish
export async function toggleMerchantCategoryStatus(id) {
  try {
    const res = await http.patch(`/merchant-categories/${id}/status`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

// Delete
export async function removeMerchantCategory(id) {
  try {
    const res = await http.delete(`/merchant-categories/${id}`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}
