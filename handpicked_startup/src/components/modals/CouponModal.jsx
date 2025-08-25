import React, { useEffect, useState } from "react";
import {
  addCoupon,
  getCoupon,
  updateCoupon,
} from "../../services/couponsService";
import { listMerchants } from "../../services/merchantService";

export default function CouponModal({ id, onClose }) {
  const isEdit = !!id;

  const [form, setForm] = useState({
    store_id: "",
    coupon_type: "coupon",
    title: "",
    h_block: "",
    coupon_code: "",
    aff_url: "",
    description: "",
    filter_id: "",
    category_id: "",
    show_proof: false,
    expiry_date: "",
    schedule_date: "",
    editor_pick: false,
    editor_order: 0,
    coupon_style: "custom",
    special_msg_type: "",
    special_msg: "",
    push_to: "",
    level: "",
    home: false,
    is_brand_coupon: false,
  });

  const [stores, setStores] = useState([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([]);

  // Lock body scroll
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  // Load stores from DB with loading & error handling
  useEffect(() => {
    (async () => {
      setStoresLoading(true);
      setStoresError(null);
      try {
        const res = await listMerchants(); // from merchantService
        if (res?.data) {
          const processedStores = res.data.map((m) => ({
            id: String(m.id),
            name: m.name,
            aff_url: m.aff_url || "",
            website: m.web_url || "",
            categories: m.category_names || [],
          }));
          setStores(processedStores);
        } else {
          setStores([]);
        }
      } catch (err) {
        console.error("Failed to load merchants:", err);
        setStoresError("Failed to load stores");
      } finally {
        setStoresLoading(false);
      }
    })();
  }, []);

  // Load existing coupon in edit mode
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const data = await getCoupon(id);
      if (!data) return;
      setForm({
        store_id: String(data.merchant_id) || "",
        coupon_type: data.coupon_type || "coupon",
        title: data.title || "",
        h_block: data.h_block || "",
        coupon_code: data.coupon_code || "",
        aff_url: data.aff_url || data.url || "",
        description: data.description || "",
        filter_id: data.filter_id || "",
        category_id: data.category_id || "",
        show_proof: !!data.show_proof,
        expiry_date: data.ends_at?.slice(0, 10) || "",
        schedule_date: data.starts_at?.slice(0, 10) || "",
        editor_pick: !!data.is_editor,
        editor_order: Number(data.editor_order || 0),
        coupon_style: data.coupon_style || "custom",
        special_msg_type: data.special_msg_type || "",
        special_msg: data.special_msg || "",
        push_to: data.push_to || "",
        level: data.level || "",
        home: !!data.home,
        is_brand_coupon: !!data.is_brand_coupon,
      });
    })();
  }, [id, isEdit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        fd.append(k, typeof v === "boolean" ? String(v) : String(v));
      });
      if (logoFile) fd.append("image", logoFile);
      if (proofFile) fd.append("proof_image", proofFile);

      const res = isEdit ? await updateCoupon(id, fd) : await addCoupon(fd);
      if (res?.error) {
        alert(res.error.message || "Save failed");
      } else {
        onClose?.();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-6xl rounded shadow-lg p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Update coupon or deal" : "Add coupon or deal"}
          </h2>
          <button className="border px-3 py-1 rounded" onClick={onClose}>
            Back
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Store */}
          <div>
            <label className="block mb-1">Store</label>
            {storesLoading ? (
              <div className="text-gray-500 text-sm">Loading stores...</div>
            ) : storesError ? (
              <div className="text-red-500 text-sm">{storesError}</div>
            ) : (
              <select
                value={form.store_id}
                onChange={(e) => {
                  const storeId = e.target.value;
                  setForm({ ...form, store_id: storeId });

                  const selectedStore = stores.find((s) => s.id === storeId);
                  if (selectedStore) {
                    setForm((prev) => ({
                      ...prev,
                      aff_url:
                        selectedStore.aff_url || selectedStore.website || "",
                      category_id:
                        selectedStore.categories?.[0] || prev.category_id,
                    }));
                    setAvailableCategories(selectedStore.categories || []);
                  } else {
                    setAvailableCategories([]);
                  }
                }}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">Select store</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Website or Affiliate URL */}
          <div>
            <label className="block mb-1">Website or Affiliate URL</label>
            <input
              value={form.aff_url}
              onChange={(e) => setForm({ ...form, aff_url: e.target.value })}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          {/* Store Category */}
          <div>
            <label className="block mb-1">Store Category</label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
              className="w-full border px-3 py-2 rounded"
            >
              <option value="">Select category</option>
              {availableCategories.map((cat, idx) => (
                <option key={idx} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Rest of your fields unchanged */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={busy}
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-400"
            >
              {busy ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
