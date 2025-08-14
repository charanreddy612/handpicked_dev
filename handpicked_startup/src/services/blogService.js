// src/services/blogService.js
import axios from "axios";
import { API_BASE_URL } from "../config/api";

const http = axios.create({
  baseURL: `${API_BASE_URL}/api`, // matches your other services
  withCredentials: true
});

export async function listBlogs(params = {}) {
  try {
    const res = await http.get("/blogs", { params });
    return { data: res.data?.data ?? [], error: res.data?.error ?? null };
  } catch (err) {
    return { data: [], error: { message: err.message } };
  }
}

export async function createBlog(formData) {
  try {
    const res = await http.post("/blogs", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

export async function deleteBlog(id) {
  try {
    const res = await http.delete(`/blogs/${id}`);
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

export async function fetchBlogAux() {
  try {
    const [catsRes, authsRes] = await Promise.all([
      http.get("/blog-categories"),
      http.get("/authors"),
    ]);
    return {
      categories: catsRes.data?.data ?? [],
      authors: authsRes.data?.data ?? [],
    };
  } catch (err) {
    return { categories: [], authors: [] };
  }
}

export async function updateBlogStatus(id, is_publish) {
  try {
    const res = await http.patch(`/blogs/${id}/status`, { is_publish });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

export async function updateBlog(id, formData) {
  try {
    const res = await http.patch(`/blogs/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return { data: res.data?.data ?? null, error: res.data?.error ?? null };
  } catch (err) {
    return { data: null, error: { message: err.message } };
  }
}

export async function getBlog(id) {
  try {
    const res = await http.get(`/blogs/${id}`);
    return res.data?.data ?? null;
  } catch (err) {
    return null;
  }
}