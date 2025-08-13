// src/services/tagService.js
import axios from "axios";
import { API_BASE_URL } from "src/config/api";

// Centralized axios instance
const http = axios.create({
  baseURL: `${API_BASE_URL}/tags`,
  headers: { "Content-Type": "application/json" },
});

// Common error formatter
function toServiceError(error) {
  const status = error?.response?.status;
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Request failed";
  const details = error?.response?.data;
  return { message, status, details, raw: error };
}

// -------- Existing methods (unchanged) --------
export async function getTags() {
  try {
    const res = await http.get("/");
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}

export async function createTag(tagData) {
  try {
    const res = await http.post("/", tagData);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}

// ✅ Already added earlier
export async function createTagWithImage(formData) {
  try {
    const res = await http.post("/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}

export async function updateTag(tagId, tagData) {
  try {
    const res = await http.put(`/${tagId}`, tagData);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}

// ✅ NEW: Update tag with FormData (including image & new fields)
export async function updateTagWithImage(tagId, formData) {
  try {
    const res = await http.put(`/${tagId}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}

export async function deleteTag(tagId) {
  try {
    const res = await http.delete(`/${tagId}`);
    return { data: res.data, error: null };
  } catch (err) {
    return { data: null, error: toServiceError(err) };
  }
}