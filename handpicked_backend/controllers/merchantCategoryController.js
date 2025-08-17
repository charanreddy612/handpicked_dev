// src/controllers/merchantCategoryController.js
import * as mcRepo from "../dbhelper/MerchantCategoryRepo.js";
import { uploadImageBuffer } from "../services/storageService.js";
import { deleteFilesByUrls } from "../services/deleteFilesByUrl.js";

const BUCKET = process.env.UPLOAD_BUCKET || "merchant-categories-images";
const FOLDER = "merchant-categories";

const toBool = (v) => v === true || v === "true" || v === "1";
const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export async function listCategories(req, res) {
  try {
    const name = req.query?.name || "";
    const page = Math.max(1, toInt(req.query?.page || 1, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query?.limit || 20, 20)));

    const filter = {
      name,
      show_home: req.query?.show_home !== undefined ? toBool(req.query.show_home) : undefined,
      show_deals_page: req.query?.show_deals_page !== undefined ? toBool(req.query.show_deals_page) : undefined,
      is_publish: req.query?.is_publish !== undefined ? toBool(req.query.is_publish) : undefined,
      is_header: req.query?.is_header !== undefined ? toBool(req.query.is_header) : undefined,
    };

    const { rows, total } = await mcRepo.list({ ...filter, page, limit });
    return res.json({ data: { rows, total }, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error listing categories", details: err?.message || err } });
  }
}

export async function getCategory(req, res) {
  try {
    const { id } = req.params;
    const data = await mcRepo.getById(id);
    return res.json({ data, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error fetching category", details: err?.message || err } });
  }
}

export async function createCategory(req, res) {
  try {
    const b = req.body || {};
    const f = req.files || {};

    const toInsert = {
      name: b.name,
      slug: await mcRepo.ensureUniqueSlug(b.slug || b.name || ""),
      description: b.description || "",
      meta_title: b.meta_title || "",
      meta_keywords: b.meta_keywords || "",
      meta_description: b.meta_description || "",
      parent_id: b.parent_id ? Number(b.parent_id) : null,
      top_banner_link_url: b.top_banner_link_url || "",
      side_banner_link_url: b.side_banner_link_url || "",
      show_home: toBool(b.show_home),
      show_deals_page: toBool(b.show_deals_page),
      is_publish: toBool(b.is_publish),
      is_header: toBool(b.is_header),
    };

    if (f.thumb?.[0]) {
      const file = f.thumb;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error) return res.status(500).json({ data: null, error: { message: "Thumb upload failed", details: error } });
      toInsert.thumb_url = url;
    }
    if (f.top_banner?.[0]) {
      const file = f.top_banner;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error)
        return res.status(500).json({ data: null, error: { message: "Top banner upload failed", details: error } });
      toInsert.top_banner_url = url;
    }
    if (f.side_banner?.[0]) {
      const file = f.side_banner;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error)
        return res.status(500).json({ data: null, error: { message: "Side banner upload failed", details: error } });
      toInsert.side_banner_url = url;
    }

    const created = await mcRepo.insert(toInsert);
    return res.status(201).json({ data: created, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error creating category", details: err?.message || err } });
  }
}

export async function updateCategory(req, res) {
  try {
    const { id } = req.params;
    const b = req.body || {};
    const f = req.files || {};

    const patch = {
      name: b.name ?? undefined,
      description: b.description ?? undefined,
      meta_title: b.meta_title ?? undefined,
      meta_keywords: b.meta_keywords ?? undefined,
      meta_description: b.meta_description ?? undefined,
      parent_id: b.parent_id !== undefined ? (b.parent_id ? Number(b.parent_id) : null) : undefined,
      top_banner_link_url: b.top_banner_link_url ?? undefined,
      side_banner_link_url: b.side_banner_link_url ?? undefined,
      show_home: b.show_home !== undefined ? toBool(b.show_home) : undefined,
      show_deals_page: b.show_deals_page !== undefined ? toBool(b.show_deals_page) : undefined,
      is_publish: b.is_publish !== undefined ? toBool(b.is_publish) : undefined,
      is_header: b.is_header !== undefined ? toBool(b.is_header) : undefined,
    };

    if (b.slug !== undefined) {
      patch.slug = await mcRepo.ensureUniqueSlugOnUpdate(id, b.slug);
    } else if (b.name !== undefined && b.name) {
      patch.slug = await mcRepo.ensureUniqueSlugOnUpdate(id, b.name);
    }

    if (toBool(b.remove_thumb)) patch.thumb_url = null;
    if (toBool(b.remove_top_banner)) patch.top_banner_url = null;
    if (toBool(b.remove_side_banner)) patch.side_banner_url = null;

    if (f.thumb?.[0]) {
      const file = f.thumb;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error) return res.status(500).json({ data: null, error: { message: "Thumb upload failed", details: error } });
      patch.thumb_url = url;
    }
    if (f.top_banner?.[0]) {
      const file = f.top_banner;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error)
        return res.status(500).json({ data: null, error: { message: "Top banner upload failed", details: error } });
      patch.top_banner_url = url;
    }
    if (f.side_banner?.[0]) {
      const file = f.side_banner;
      const { url, error } = await uploadImageBuffer(BUCKET, FOLDER, file.buffer, file.originalname, file.mimetype);
      if (error)
        return res.status(500).json({ data: null, error: { message: "Side banner upload failed", details: error } });
      patch.side_banner_url = url;
    }

    const updated = await mcRepo.update(id, patch);
    return res.json({ data: updated, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error updating category", details: err?.message || err } });
  }
}

export async function updateCategoryStatus(req, res) {
  try {
    const { id } = req.params;
    const updated = await mcRepo.toggleStatus(id);
    return res.json({ data: updated, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error updating category status", details: err?.message || err } });
  }
}

export async function deleteCategory(req, res) {
  try {
    const { id } = req.params;

    const c = await mcRepo.getById(id);
    if (!c) return res.status(404).json({ data: null, error: { message: "Category not found" } });

    const urls = [c.thumb_url, c.top_banner_url, c.side_banner_url].filter(Boolean);
    try {
      if (urls.length) await deleteFilesByUrls(BUCKET, urls);
    } catch (fileErr) {
      console.error("Category file deletion failed:", fileErr?.message || fileErr);
      // choose to proceed; change policy if strict consistency required
    }

    const ok = await mcRepo.remove(id);
    if (!ok) return res.status(500).json({ data: null, error: { message: "Failed to delete category" } });

    return res.json({ data: { id, deleted_files: urls.length }, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({ data: null, error: { message: "Error deleting category", details: err?.message || err } });
  }
}
