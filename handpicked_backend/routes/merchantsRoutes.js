import express from "express";
import {
  getAllMerchants,
  getMerchantById,
  createMerchant,
  updateMerchant,
  deleteMerchant
} from "../controllers/merchantsController.js";

const router = express.Router();

router.get("/", getAllMerchants);
router.get("/:id", getMerchantById);
router.post("/", createMerchant);
router.put("/:id", updateMerchant);
router.delete("/:id", deleteMerchant);

export default router;