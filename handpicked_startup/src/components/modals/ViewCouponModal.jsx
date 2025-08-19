import React, { useEffect, useState } from "react";
import { getCoupon } from "../../services/couponsService.js";

export default function ViewCouponModal({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    (async () => setData(await getCoupon(id)))();
  }, [id]);

  if (!data) return null;
  return (
    <div className="modal">
      <div className="card">
        <div className="head">
          <div className="title">View coupon or deal</div>
          <button className="btn" onClick={onClose}>
            Back
          </button>
        </div>
        <div className="body">
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
