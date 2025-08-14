// src/components/blogs/AddBlogModal.jsx
import React, { useState, useEffect } from "react";
import { createBlog, fetchBlogAux } from "../../services/blogService";

export default function AddBlogModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    category_id: NULL,
    author_id: NULL,
    content: "",
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    is_publish: false,
    is_featured: false,
    is_top: false,
  });
  const [thumb, setThumb] = useState(null);
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { categories, authors } = await fetchBlogAux();
      setCategories(categories);
      setAuthors(authors);
    })();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTitleBlur = () => {
    if (!form.slug && form.title) {
      const slug = form.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");
      setForm((f) => ({ ...f, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    const fd = new FormData();
    console.log([...fd.entries()]);
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (thumb) fd.append("featured_thumb", thumb);
    if (image) fd.append("featured_image", image);

    const { error } = await createBlog(fd);
    setSaving(false);
    if (!error) {
      if (onSave) onSave();
      onClose();
    } else {
      console.error("Error creating blog:", error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add Blog</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Title</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                onBlur={handleTitleBlur}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label>Slug</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
          </div>
          {/* Category & Author */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Blog Category</label>
              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Blog Author</label>
              <select
                name="author_id"
                value={form.author_id}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select</option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Content */}
          <div>
            <label>Content</label>
            <textarea
              name="content"
              value={form.content}
              onChange={handleChange}
              rows={6}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          {/* Meta fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label>Meta Title</label>
              <input
                name="meta_title"
                value={form.meta_title}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label>Meta Keywords</label>
              <input
                name="meta_keywords"
                value={form.meta_keywords}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label>Meta Description</label>
              <input
                name="meta_description"
                value={form.meta_description}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
          {/* File uploads */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label>Featured Thumb</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setThumb(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label>Featured Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
            </div>
          </div>
          {/* Toggles */}
          <div className="flex gap-6">
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                name="is_publish"
                checked={form.is_publish}
                onChange={handleChange}
              />
              Publish
            </label>
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                name="is_featured"
                checked={form.is_featured}
                onChange={handleChange}
              />
              Featured
            </label>
            <label className="flex gap-2 items-center">
              <input
                type="checkbox"
                name="is_top"
                checked={form.is_top}
                onChange={handleChange}
              />
              Top
            </label>
          </div>
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="border px-4 py-2 rounded">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {saving ? "Saving..." : "Add Blog"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}