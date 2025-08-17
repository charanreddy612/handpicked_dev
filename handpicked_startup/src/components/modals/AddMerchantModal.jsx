// src/components/merchants/AddMerchantModal.jsx
import React, { useState } from "react";
import { addMerchant } from "../../services/merchantService.js";

export default function AddMerchantModal({ onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    meta_title: "",
    meta_keywords: "",
    meta_description: "",
    website: "",
    email: "",
    phone: "",
    show_home: false,
    show_deals_page: false,
    is_publish: false,
    is_header: false,
  });
  const [logo, setLogo] = useState(null);
  const [topBanner, setTopBanner] = useState(null);
  const [sideBanner, setSideBanner] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleNameBlur = () => {
    if (!form.slug && form.name) {
      const slug = String(form.name)
        .trim()
        .toLowerCase()
        .replace(/['"]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setForm((f) => ({ ...f, slug }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) return;
    setSaving(true);

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("slug", form.slug);
    fd.append("description", form.description || "");
    fd.append("meta_title", form.meta_title || "");
    fd.append("meta_keywords", form.meta_keywords || "");
    fd.append("meta_description", form.meta_description || "");
    fd.append("website", form.website || "");
    fd.append("email", form.email || "");
    fd.append("phone", form.phone || "");
    fd.append("show_home", String(!!form.show_home));
    fd.append("show_deals_page", String(!!form.show_deals_page));
    fd.append("is_publish", String(!!form.is_publish));
    fd.append("is_header", String(!!form.is_header));
    if (logo) fd.append("logo", logo);
    if (topBanner) fd.append("top_banner", topBanner);
    if (sideBanner) fd.append("side_banner", sideBanner);

    try {
      // const { error } = await addMerchant(fd);
      const error = null; // remove after wiring service
      if (error) throw new Error(error.message || "Create failed");
      onSave?.();
      onClose?.();
    } catch (err) {
      console.error("Add merchant failed:", err?.message || err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Add Merchant</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name & Slug */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                onBlur={handleNameBlur}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
            <div>
              <label className="block mb-1">Slug</label>
              <input
                name="slug"
                value={form.slug}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={6}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Meta fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">Meta Title</label>
              <input
                name="meta_title"
                value={form.meta_title}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Meta Keywords</label>
              <input
                name="meta_keywords"
                value={form.meta_keywords}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Meta Description</label>
              <input
                name="meta_description"
                value={form.meta_description}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block mb-1">Website</label>
              <input
                name="website"
                value={form.website}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
            <div>
              <label className="block mb-1">Phone</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>

          {/* Uploads */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block mb-1">Logo (webp/png)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block mb-1">Top Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setTopBanner(e.target.files?.[0] || null)}
              />
            </div>
            <div>
              <label className="block mb-1">Side Banner</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSideBanner(e.target.files?.[0] || null)}
              />
            </div>
          </div>

          {/* Toggles */}
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="show_home"
                checked={!!form.show_home}
                onChange={handleChange}
              />
              Show Home
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="show_deals_page"
                checked={!!form.show_deals_page}
                onChange={handleChange}
              />
              Show Deals Page
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_publish"
                checked={!!form.is_publish}
                onChange={handleChange}
              />
              Publish
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="is_header"
                checked={!!form.is_header}
                onChange={handleChange}
              />
              Is Header
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" className="border px-4 py-2 rounded" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {saving ? "Adding..." : "Add Merchant"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
