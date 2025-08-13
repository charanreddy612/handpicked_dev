// src/routes/tags.routes.js
import { Router } from "express";
import * as tagsCtrl from "../controllers/tagsController.js";
import * as tagStoresCtrl from "../controllers/tagStoresController.js";
import { uploadMemory } from "../middleware/uploadMemory.js";

const router = Router();

// Tag CRUD
router.get("/", tagsCtrl.listTags);
router.get("/:id", tagsCtrl.getTag);
router.post("/", uploadMemory.single("image"), tagsCtrl.createTag);
router.put("/:id", uploadMemory.single("image"), tagsCtrl.updateTag);
router.delete("/:id", tagsCtrl.deleteTag);

// Tag-Stores
router.get("/:tagId/stores", tagStoresCtrl.getStoresByTag);
router.get("/stores/search", tagStoresCtrl.searchStores);
router.post("/:tagId/stores", tagStoresCtrl.addStoreToTag);
router.delete("/:tagId/stores/:storeId", tagStoresCtrl.removeStoreFromTag);

export default router;