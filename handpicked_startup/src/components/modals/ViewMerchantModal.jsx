// src/components/merchants/ViewMerchantModal.jsx
import React, { useEffect, useState } from "react";
import { getMerchant } from "../../services/merchantService.js";

export default function ViewMerchantModal({ merchantId, onClose }) {
  const [merchant, setMerchant] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const m = await getMerchant(merchantId);
        if (!mounted) return;
        setMerchant(m || {});
      } catch (e) {
        console.error("Load merchant failed:", e?.message || e);
        if (mounted) setMerchant({});
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [merchantId]);

  const Field = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-4 items-start">
      <div className="text-gray-600">{label}</div>
      <div className="col-span-2">{value ?? "—"}</div>
    </div>
  );

  const boolText = (v) => (v ? "Yes" : "No");

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 text-white">
        Loading…
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Merchant Details</h2>
          <button className="border px-3 py-1 rounded" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="space-y-3">
          <Field label="ID" value={merchant.id} />
          <Field label="Name" value={merchant.name} />
          <Field label="Slug" value={merchant.slug} />
          <Field label="Website" value={merchant.website} />
          <Field label="Email" value={merchant.email} />
          <Field label="Phone" value={merchant.phone} />
          <Field label="Publish" value={boolText(merchant?.is_publish)} />
          <Field label="Show Home" value={boolText(merchant?.show_home)} />
          <Field label="Show Deals Page" value={boolText(merchant?.show_deals_page)} />
          <Field label="Is Header" value={boolText(merchant?.is_header)} />
          <Field label="Created" value={merchant?.created_at ? new Date(merchant.created_at).toLocaleString() : "—"} />
          <Field label="Views" value={merchant?.views ?? 0} />

          <div className="grid grid-cols-3 gap-6 mt-4">
            <div>
              <div className="text-gray-600 mb-1">Logo</div>
              {merchant?.logo_url ? (
                <img src={merchant.logo_url} alt="Logo" className="w-32 h-32 object-cover border rounded" />
              ) : (
                <div className="w-32 h-32 border rounded flex items-center justify-center text-xs text-gray-500">—</div>
              )}
            </div>
            <div>
              <div className="text-gray-600 mb-1">Top Banner</div>
              {merchant?.top_banner_url ? (
                <img src={merchant.top_banner_url} alt="Top banner" className="w-48 h-24 object-cover border rounded" />
              ) : (
                <div className="w-48 h-24 border rounded flex items-center justify-center text-xs text-gray-500">—</div>
              )}
            </div>
            <div>
              <div className="text-gray-600 mb-1">Side Banner</div>
              {merchant?.side_banner_url ? (
                <img src={merchant.side_banner_url} alt="Side banner" className="w-40 h-40 object-cover border rounded" />
              ) : (
                <div className="w-40 h-40 border rounded flex items-center justify-center text-xs text-gray-500">—</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-gray-600 mb-1">Description</div>
            <div className="border rounded p-3 whitespace-pre-wrap">
              {merchant?.description || "—"}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-gray-600 mb-1">Meta Title</div>
              <div className="border rounded p-2">{merchant?.meta_title || "—"}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Meta Keywords</div>
              <div className="border rounded p-2">{merchant?.meta_keywords || "—"}</div>
            </div>
            <div>
              <div className="text-gray-600 mb-1">Meta Description</div>
              <div className="border rounded p-2">{merchant?.meta_description || "—"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
