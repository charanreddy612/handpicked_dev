// src/controllers/merchantController.js
import * as merchantRepo from "../dbhelper/MerchantRepo.js";
import {
  uploadImageBuffer,
  deleteImageByPublicUrl,
} from "../services/storageService.js";
const BUCKET = process.env.UPLOAD_BUCKET || "merchant-images";
const FOLDER = "merchants";

// Helpers
const toBool = (v) => v === true || v === "true" || v === "1";
const toInt = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

export async function listMerchants(req, res) {
  try {
    const name = req.query?.name || "";
    const page = Math.max(1, toInt(req.query?.page || 1, 1));
    const limit = Math.min(100, Math.max(1, toInt(req.query?.limit || 20, 20)));

    const { rows, total } = await merchantRepo.list({ name, page, limit });

    return res.json({ data: { rows, total }, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error listing merchants",
          details: err?.message || err,
        },
      });
  }
}

export async function getMerchant(req, res) {
  try {
    const { id } = req.params;
    const data = await merchantRepo.getById(id);
    return res.json({ data, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error fetching merchant",
          details: err?.message || err,
        },
      });
  }
}

export async function createMerchant(req, res) {
  try {
    const body = req.body || {};
    const files = req.files || {};

    const toInsert = {
      name: body.name,
      slug: await merchantRepo.ensureUniqueSlug(body.slug || body.name || ""),
      description: body.description || "",
      meta_title: body.meta_title || "",
      meta_keywords: body.meta_keywords || "",
      meta_description: body.meta_description || "",
      website: body.website || "",
      email: body.email || "",
      phone: body.phone || "",
      show_home: toBool(body.show_home),
      show_deals_page: toBool(body.show_deals_page),
      is_publish: toBool(body.is_publish),
      is_header: toBool(body.is_header),
    };

    // Images (optional)
    if (files.logo?.[0]) {
      const f = files.logo;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Logo upload failed", details: error },
          });
      toInsert.logo_url = url;
    }
    if (files.top_banner?.[0]) {
      const f = files.top_banner;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Top banner upload failed", details: error },
          });
      toInsert.top_banner_url = url;
    }
    if (files.side_banner?.[0]) {
      const f = files.side_banner;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Side banner upload failed", details: error },
          });
      toInsert.side_banner_url = url;
    }

    const created = await merchantRepo.insert(toInsert);
    return res.status(201).json({ data: created, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error creating merchant",
          details: err?.message || err,
        },
      });
  }
}

export async function updateMerchant(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const files = req.files || {};

    const patch = {
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      meta_title: body.meta_title ?? undefined,
      meta_keywords: body.meta_keywords ?? undefined,
      meta_description: body.meta_description ?? undefined,
      website: body.website ?? undefined,
      email: body.email ?? undefined,
      phone: body.phone ?? undefined,
      show_home:
        body.show_home !== undefined ? toBool(body.show_home) : undefined,
      show_deals_page:
        body.show_deals_page !== undefined
          ? toBool(body.show_deals_page)
          : undefined,
      is_publish:
        body.is_publish !== undefined ? toBool(body.is_publish) : undefined,
      is_header:
        body.is_header !== undefined ? toBool(body.is_header) : undefined,
    };

    // Slug: if provided, normalize and ensure unique; else leave unchanged
    if (body.slug !== undefined) {
      patch.slug = await merchantRepo.ensureUniqueSlugOnUpdate(id, body.slug);
    } else if (body.name !== undefined && body.name) {
      // optional auto-sync slug with name if slug not sent
      patch.slug = await merchantRepo.ensureUniqueSlugOnUpdate(id, body.name);
    }

    // Optional explicit removals
    if (toBool(body.remove_logo)) patch.logo_url = null;
    if (toBool(body.remove_top_banner)) patch.top_banner_url = null;
    if (toBool(body.remove_side_banner)) patch.side_banner_url = null;

    // New files overwrite URLs
    if (files.logo?.[0]) {
      const f = files.logo;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Logo upload failed", details: error },
          });
      patch.logo_url = url;
    }
    if (files.top_banner?.[0]) {
      const f = files.top_banner;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Top banner upload failed", details: error },
          });
      patch.top_banner_url = url;
    }
    if (files.side_banner?.[0]) {
      const f = files.side_banner;
      const { url, error } = await uploadImageBuffer(
        BUCKET,
        FOLDER,
        f.buffer,
        f.originalname,
        f.mimetype
      );
      if (error)
        return res
          .status(500)
          .json({
            data: null,
            error: { message: "Side banner upload failed", details: error },
          });
      patch.side_banner_url = url;
    }

    const updated = await merchantRepo.update(id, patch);
    return res.json({ data: updated, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error updating merchant",
          details: err?.message || err,
        },
      });
  }
}

export async function updateMerchantStatus(req, res) {
  try {
    const { id } = req.params;
    const updated = await merchantRepo.toggleStatus(id);
    return res.json({ data: updated, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error updating merchant status",
          details: err?.message || err,
        },
      });
  }
}

export async function deleteMerchant(req, res) {
  try {
    const { id } = req.params;

    //Load merchant to collect current file URLs
    const m = await merchantRepo.getById(id);
    if (!m) {
      return res
        .status(404)
        .json({ data: null, error: { message: "Merchant not found" } });
    }

    const urls = [m.logo_url, m.top_banner_url, m.side_banner_url].filter(
      Boolean
    );

    //delete files (non-fatal by default; log errors but proceed)
    try {
      if (urls.length) {
        await deleteFilesByUrls(urls);
      }
    } catch (fileErr) {
      // Policy choice:
      // - Option A : log and continue with DB delete
      console.error(
        "Merchant file deletion failed:",
        fileErr?.message || fileErr
      );
      // - Option B: return 500 to force retry if storage consistency is critical
      // uncomment the next line and return.
      // return res.status(500).json({ data: null, error: { message: "Failed to delete merchant files", details: fileErr?.message || fileErr } });
    }

    // Delete the merchant row
    const ok = await merchantRepo.remove(id);
    if (!ok) {
      return res
        .status(500)
        .json({ data: null, error: { message: "Failed to delete merchant" } });
    }

    return res.json({ data: { id, deleted_files: urls.length }, error: null });
  } catch (err) {
    return res
      .status(500)
      .json({
        data: null,
        error: {
          message: "Error deleting merchant",
          details: err?.message || err,
        },
      });
  }
}
