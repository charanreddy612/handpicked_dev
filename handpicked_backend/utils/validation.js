// src/utils/validation.js
export function normalizeTagPayload(body) {
  const toNull = (v) => (v === "" || v === undefined ? null : v);

  const active =
    body.active === true ||
    body.active === "true" ||
    body.active === 1 ||
    body.active === "1";

  const display_order_num = Number.isFinite(Number(body.display_order))
    ? Number(body.display_order)
    : 0;

  return {
    tag_name: (body.tag_name || "").trim(),
    slug: (body.slug || "").trim(),
    parent_id: toNull(body.parent_id),
    active,
    display_order: display_order_num,
    meta_title: toNull((body.meta_title || "").trim()),
    meta_description: toNull((body.meta_description || "").trim()),
    meta_keywords: toNull((body.meta_keywords || "").trim()),
    existing_image_url: toNull(body.existing_image_url),
  };
}

export function validateTagPayload(fields, { requireName = true, requireSlug = false } = {}) {
  const errors = [];

  if (requireName && !fields.tag_name) {
    errors.push("tag_name is required.");
  }
  if (requireSlug && !fields.slug) {
    errors.push("slug is required.");
  }
  if (fields.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fields.slug)) {
    errors.push("slug must be URL-safe (lowercase letters, numbers, hyphens).");
  }
  if (fields.display_order != null && Number.isNaN(Number(fields.display_order))) {
    errors.push("display_order must be a number.");
  }
  if (fields.parent_id !== null && fields.parent_id !== undefined) {
    if (fields.parent_id !== "" && isNaN(Number(fields.parent_id))) {
      errors.push("parent_id must be a number or empty.");
    }
  }

  return { ok: errors.length === 0, errors };
}