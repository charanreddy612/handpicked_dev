export const getAllCoupons = (req, res) => {
  res.json({ message: "Get all coupons" });
};

export const getCouponById = (req, res) => {
  res.json({ message: `Get coupon ${req.params.id}` });
};

export const createCoupon = (req, res) => {
  res.json({ message: "Coupon created" });
};

export const updateCoupon = (req, res) => {
  res.json({ message: `Coupon ${req.params.id} updated` });
};

export const deleteCoupon = (req, res) => {
  res.json({ message: `Coupon ${req.params.id} deleted` });
};