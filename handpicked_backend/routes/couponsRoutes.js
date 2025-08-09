import express from "express";
import {
  getAllCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon
} from "../controllers/couponsController.js";

const router = express.Router();

router.get("/", getAllCoupons);
router.get("/:id", getCouponById);
router.post("/", createCoupon);
router.put("/:id", updateCoupon);
router.delete("/:id", deleteCoupon);

export default router;