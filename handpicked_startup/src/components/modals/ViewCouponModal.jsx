import React, { useEffect, useState } from "react";
import { getCoupon } from "../../services/couponsService";

export default function ViewCouponModal({ id, onClose }) {
  const [data, setData] = useState(null);

  // Lock body scroll while open (same as other modals)
  useEffect(() => {
    document.body.classList.add("modal-open");
    return () => document.body.classList.remove("modal-open");
  }, []);

  useEffect(() => {
    (async () => setData(await getCoupon(id)))();
  }, [id]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      {/* Match Merchants/CouponModal: card scrolls with max-h */}
      <div className="bg-white w-full max-w-4xl rounded shadow-lg p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">View coupon or deal</h2>
          <button className="border px-3 py-1 rounded" onClick={onClose}>Back</button>
        </div>

        {/* Simple read-only layout; expand or restyle as needed */}
        <div className="space-y-3">
          <KV k="Store ID" v={data.merchant_id} />
          <KV k="Type" v={data.coupon_type} />
          <KV k="Title" v={data.title} />
          {data.coupon_type === "coupon" && <KV k="Coupon Code" v={data.coupon_code || "-"} />}
          <KV k="Website/Affiliate URL" v={data.aff_url || "-"} />
          <KV k="H2/H3" v={data.h_block || "-"} />
          <KV k="Filter" v={data.filter_id ?? "-"} />
          <KV k="Store Category" v={data.category_id ?? "-"} />
          <KV k="Show proof?" v={data.show_proof ? "Yes" : "No"} />
          <KV k="Schedule Date" v={data.starts_at?.slice(0,10) || "-"} />
          <KV k="Expiry Date" v={data.ends_at?.slice(0,10) || "-"} />
          <KV k="Editor Pick" v={data.is_editor ? "Yes" : "No"} />
          <KV k="Editor order" v={data.editor_order ?? 0} />
          <KV k="Coupon Style" v={data.coupon_style || "-"} />
          <KV k="Special Message Type" v={data.special_msg_type || "-"} />
          <KV k="Special Message" v={data.special_msg || "-"} />
          <KV k="Push to" v={data.push_to || "-"} />
          <KV k="Level" v={data.level || "-"} />
          <KV k="Display in home?" v={data.home ? "Yes" : "No"} />
          <KV k="Is Brand Coupon?" v={data.is_brand_coupon ? "Yes" : "No"} />
          <KV k="Published" v={data.is_publish ? "Yes" : "No"} />
          <KV k="Created" v={data.created_at?.slice(0,19)?.replace("T"," ") || "-"} />
          <KV k="Updated" v={data.updated_at?.slice(0,19)?.replace("T"," ") || "-"} />

          {/* Images */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Coupon/Brand Image</div>
            {data.image_url ? (
              <img src={data.image_url} alt="coupon" className="max-w-full max-h-40 rounded border" />
            ) : (
              <div className="text-sm text-gray-500">-</div>
            )}
          </div>

          <div>
            <div className="text-sm text-gray-600 mb-1">Proof Image</div>
            {data.proof_image_url ? (
              <img src={data.proof_image_url} alt="proof" className="max-w-full max-h-60 rounded border" />
            ) : (
              <div className="text-sm text-gray-500">-</div>
            )}
          </div>

          {/* Description */}
          <div>
            <div className="text-sm text-gray-600 mb-1">Description</div>
            <div className="whitespace-pre-wrap border rounded p-3 text-sm">
              {data.description || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }) {
  return (
    <div className="flex gap-2 text-sm">
      <div className="w-48 text-gray-600">{k}</div>
      <div className="flex-1 text-gray-900 break-words">{String(v ?? "")}</div>
    </div>
  );
}
