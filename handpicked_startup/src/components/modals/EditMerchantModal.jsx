// src/components/merchants/EditMerchantModal.jsx
import React, { useEffect, useState } from "react";
import { getMerchant, updateMerchant } from "../../services/merchantService.js";

export default function EditMerchantModal({ merchantId, onClose, onSave }) {
  const [form, setForm] = useState(null);
  const [logo, setLogo] = useState(null);
  const [topBanner, setTopBanner] = useState(null);
  const [sideBanner, setSideBanner] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // temp object URLs for previews
  const [tempLogoUrl, setTempLogoUrl] = useState(null);
  const [tempTopUrl, setTempTopUrl] = useState(null);
  const [tempSideUrl, setTempSideUrl] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getMerchant(merchantId);
        if (!mounted) return;
        const merchant = m || {};
        setForm({
          id: merchant.id,
          name: merchant.name || "",
          slug: merchant.slug || "",
          description: merchant.description || "",
          meta_title: merchant.meta_title || "",
          meta_keywords: merchant.meta_keywords || "",
          meta_description: merchant.meta_description || "",
          website: merchant.website || "",
          email: merchant.email || "",
          phone: merchant.phone || "",
          show_home: !!merchant.show_home,
          show_deals_page: !!merchant.show_deals_page,
          is_publish: !!merchant.is_publish,
          is_header: !!merchant.is_header,
          logo_url: merchant.logo_url || "",
          top_banner_url: merchant.top_banner_url || "",
          side_banner_url: merchant.side_banner_url || "",
        });
      } catch (e) {
        console.error("Load merchant failed:", e?.message || e);
        setForm({
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
          logo_url: "",
          top_banner_url: "",
          side_banner_url: "",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl);
      if (tempTopUrl) URL.revokeObjectURL(tempTopUrl);
      if (tempSideUrl) URL.revokeObjectURL(tempSideUrl);
    };
  }, [merchantId, tempLogoUrl, tempTopUrl, tempSideUrl]);

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

  const onPickLogo = (file) => {
    setLogo(file);
    if (tempLogoUrl) URL.revokeObjectURL(tempLogoUrl);
    if (file) {
      const url = URL.createObjectURL(file);
      setTempLogoUrl(url);
      setForm((f) => ({ ...f, logo_url: url }));
    }
  };

  const onPickTop = (file) => {
    setTopBanner(file);
    if (tempTopUrl) URL.revokeObjectURL(tempTopUrl);
    if (file) {
      const url = URL.createObjectURL(file);
      setTempTopUrl(url);
      setForm((f) => ({ ...f, top_banner_url: url }));
    }
  };

  const onPickSide = (file) => {
    setSideBanner(file);
    if (tempSideUrl) URL.revokeObjectURL(tempSideUrl);
    if (file) {
      const url = URL.createObjectURL(file);
      setTempSideUrl(url);
      setForm((f) => ({ ...f, side_banner_url: url }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form?.name || !form?.slug) return;
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
      const { error } = await updateMerchant(merchantId, fd);
      if (error) throw new Error(error.message || "Update failed");
      onSave?.();
      onClose?.();
    } catch (err) {
      console.error("Update merchant failed:", err?.message || err);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-white">
        Loading merchant…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-5xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Edit Merchant</h2>

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

          {/* Meta */}
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

          {/* Images with previews */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block mb-1">Logo</label>
              {form.logo_url ? (
                <img
                  src={form.logo_url}
                  alt="Logo"
                  className="w-32 h-32 object-cover border rounded mb-2"
                />
              ) : (
                <div className="w-32 h-32 border rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                  No logo
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickLogo(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block mb-1">Top Banner</label>
              {form.top_banner_url ? (
                <img
                  src={form.top_banner_url}
                  alt="Top banner"
                  className="w-48 h-24 object-cover border rounded mb-2"
                />
              ) : (
                <div className="w-48 h-24 border rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                  No top banner
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickTop(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <label className="block mb-1">Side Banner</label>
              {form.side_banner_url ? (
                <img
                  src={form.side_banner_url}
                  alt="Side banner"
                  className="w-40 h-40 object-cover border rounded mb-2"
                />
              ) : (
                <div className="w-40 h-40 border rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                  No side banner
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onPickSide(e.target.files?.[0] || null)}
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
              {saving ? "Updating..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
