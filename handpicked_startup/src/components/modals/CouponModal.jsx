import React, { useEffect, useState } from "react";
import {
  addCoupon,
  getCoupon,
  updateCoupon,
} from "../../services/couponsService.js";

export default function CouponModal({ id, onClose }) {
  const isEdit = !!id;
  const [form, setForm] = useState({
    store_id: "",
    coupon_type: "coupon", // coupon|deal
    title: "",
    h_block: "", // 'h2' | 'h3' or slug of selected block; keep generic select
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
    coupon_style: "custom", // 'custom' etc.
    special_msg_type: "",
    special_msg: "",
    push_to: "",
    level: "",
    home: false,
    is_brand_coupon: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const data = await getCoupon(id);
      if (!data) return;
      setForm({
        store_id: data.merchant_id || "",
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
        editor_order: data.editor_order || 0,
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
      if (res.error) alert(res.error.message || "Failed");
      else onClose?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal__card">
        <div className="modal__head">
          <div className="modal__title">
            {isEdit ? "Update coupon or deal" : "Add coupon or deal"}
          </div>
          <button className="btn" onClick={onClose}>
            Back
          </button>
        </div>

        <form onSubmit={onSubmit} className="form">
          <div className="row">
            <label>Store</label>
            <select
              value={form.store_id}
              onChange={(e) => setForm({ ...form, store_id: e.target.value })}
            >
              <option value="">Select store</option>
              {/* TODO: populate stores */}
            </select>
          </div>

          <div className="row">
            <label>Coupon or Deal</label>
            <select
              value={form.coupon_type}
              onChange={(e) =>
                setForm({ ...form, coupon_type: e.target.value })
              }
            >
              <option value="coupon">Coupon</option>
              <option value="deal">Deal</option>
            </select>
          </div>

          <div className="row">
            <label>Title</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          <div className="row">
            <label>Select H2 or H3</label>
            <select
              value={form.h_block}
              onChange={(e) => setForm({ ...form, h_block: e.target.value })}
            >
              <option value="">--Select--</option>
              {/* TODO: populate H2/H3 blocks */}
            </select>
          </div>

          {form.coupon_type === "coupon" && (
            <div className="row">
              <label>Coupon Code</label>
              <input
                value={form.coupon_code}
                onChange={(e) =>
                  setForm({ ...form, coupon_code: e.target.value })
                }
              />
            </div>
          )}

          <div className="row">
            <label>Website or Affiliate URL</label>
            <input
              value={form.aff_url}
              onChange={(e) => setForm({ ...form, aff_url: e.target.value })}
            />
          </div>

          <div className="row">
            <label>Description</label>
            <textarea
              rows={6}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="row">
            <label>Coupon or Brand Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
            />
            <div className="hint">
              jpg & png image only; max-width:122px; max-height:54px;
              max-size:2MB
            </div>
          </div>

          <div className="row">
            <label>Filter</label>
            <select
              value={form.filter_id}
              onChange={(e) => setForm({ ...form, filter_id: e.target.value })}
            >
              <option value="">None Selected</option>
              {/* TODO: populate filters */}
            </select>
          </div>

          <div className="row">
            <label>Store Category</label>
            <select
              value={form.category_id}
              onChange={(e) =>
                setForm({ ...form, category_id: e.target.value })
              }
            >
              <option value="">None Selected</option>
              {/* TODO: populate categories */}
            </select>
          </div>

          <div className="row">
            <label>Proof image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            />
            <div className="hint">
              jpg & png image only; max-width:650px; max-height:350px;
              max-size:2MB
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.show_proof}
                onChange={(e) =>
                  setForm({ ...form, show_proof: e.target.checked })
                }
              />
              Show proof?
            </label>
          </div>

          <div className="grid">
            <div className="row">
              <label>Expiry Date</label>
              <input
                type="date"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
              />
            </div>
            <div className="row">
              <label>Schedule Date</label>
              <input
                type="date"
                value={form.schedule_date}
                onChange={(e) =>
                  setForm({ ...form, schedule_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid">
            <div className="row">
              <label>Editor Pick?</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.editor_pick}
                  onChange={(e) =>
                    setForm({ ...form, editor_pick: e.target.checked })
                  }
                />
                Yes
              </label>
            </div>
            <div className="row">
              <label>Editor order</label>
              <input
                type="number"
                value={form.editor_order}
                onChange={(e) =>
                  setForm({
                    ...form,
                    editor_order: Number(e.target.value || 0),
                  })
                }
              />
            </div>
          </div>

          <div className="grid">
            <div className="row">
              <label>Coupon Type</label>
              <select
                value={form.coupon_style}
                onChange={(e) =>
                  setForm({ ...form, coupon_style: e.target.value })
                }
              >
                <option value="custom">Custom</option>
                {/* add other options if needed */}
              </select>
            </div>
            <div className="row">
              <label>Special Message Type</label>
              <select
                value={form.special_msg_type}
                onChange={(e) =>
                  setForm({ ...form, special_msg_type: e.target.value })
                }
              >
                <option value="">None</option>
                {/* options */}
              </select>
            </div>
          </div>

          <div className="grid">
            <div className="row">
              <label>Special Message</label>
              <input
                value={form.special_msg}
                onChange={(e) =>
                  setForm({ ...form, special_msg: e.target.value })
                }
              />
            </div>
            <div className="row">
              <label>Push to</label>
              <select
                value={form.push_to}
                onChange={(e) => setForm({ ...form, push_to: e.target.value })}
              >
                <option value="">None</option>
                {/* options */}
              </select>
            </div>
          </div>

          <div className="grid">
            <div className="row">
              <label>Level</label>
              <select
                value={form.level}
                onChange={(e) => setForm({ ...form, level: e.target.value })}
              >
                <option value="">None</option>
                {/* options */}
              </select>
            </div>
            <div className="row">
              <label>Display in home?</label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={form.home}
                  onChange={(e) => setForm({ ...form, home: e.target.checked })}
                />
                Yes
              </label>
            </div>
          </div>

          <div className="row">
            <label>Is Brand Coupon?</label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.is_brand_coupon}
                onChange={(e) =>
                  setForm({ ...form, is_brand_coupon: e.target.checked })
                }
              />
              Yes
            </label>
          </div>

          <div className="actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Saving..." : isEdit ? "Update Coupon" : "Create Coupon"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
