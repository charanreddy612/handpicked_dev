// src/dbhelper/ImportsRepo.js
import { supabase } from "../dbhelper/dbclient.js";

// Utilities
const toSlug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function ensureUniqueMerchantSlugOnUpdate(id, proposed) {
  const seed = toSlug(proposed || "merchant");
  let slug = seed;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return slug;
    slug = `${seed}-${i + 1}`;
  }
  return `${seed}-${Date.now()}`;
}

// Generic chunked insert (fast path when no conflict handling is needed)
export async function chunkedInsert(table, rows, chunkSize = 500) {
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    const { error } = await supabase.from(table).insert(slice);
    if (error) throw error;
  }
}

// Merchants
export async function getMerchantIdBySlug(slug) {
  const s = toSlug(slug);
  if (!s) return null;
  const { data, error } = await supabase
    .from("merchants")
    .select("id")
    .eq("slug", s)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function upsertMerchantBasic(row) {
  // Minimal fields from Step 1
  const payload = {
    name: row.name,
    slug: toSlug(row.slug || row.name),
    h1keyword: row.h1keyword || "",
    web_url: row.web_url || "",
    aff_url: row.aff_url || "",
    meta_title: row.seo_title || "",
    meta_description: row.seo_desc || "",
  };
  if (!payload.slug) throw new Error("Missing slug");

  // Does it exist?
  const { data: existing, error: ge } = await supabase
    .from("merchants")
    .select("id, slug")
    .eq("slug", payload.slug)
    .limit(1)
    .maybeSingle();
  if (ge) throw ge;

  if (existing?.id) {
    const { data, error } = await supabase
      .from("merchants")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return { action: "update", id: data.id };
  } else {
    const { data, error } = await supabase
      .from("merchants")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { action: "insert", id: data.id };
  }
}

export async function updateMerchantBySlug(slug, patch) {
  const s = toSlug(slug);
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([, v]) => v !== undefined)
  );
  if (!s || !Object.keys(clean).length) return { updated: 0 };
  const { data, error } = await supabase
    .from("merchants")
    .update(clean)
    .eq("slug", s)
    .select("id")
    .single();
  if (error) throw error;
  return { updated: 1, id: data.id };
}

export async function updateMerchantSeoDescBySlug(slug, seo_desc) {
  return updateMerchantBySlug(slug, { meta_description: seo_desc || "" });
}

export async function updateMerchantFirstParagraphBySlug(slug, html) {
  // Map to your chosen field; using side_description_html per our DDL
  return updateMerchantBySlug(slug, { side_description_html: html || "" });
}

export async function updateMerchantSlug(oldSlug, newSlug) {
  const sOld = toSlug(oldSlug);
  const sNewSeed = toSlug(newSlug);
  if (!sOld || !sNewSeed) throw new Error("Invalid slugs");

  // Load current id
  const { data: cur, error: ge } = await supabase
    .from("merchants")
    .select("id")
    .eq("slug", sOld)
    .maybeSingle();
  if (ge) throw ge;
  if (!cur?.id) throw new Error(`Merchant not found for old_slug: ${sOld}`);

  // Ensure uniqueness
  let candidate = sNewSeed;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", candidate)
      .neq("id", cur.id)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    candidate = `${sNewSeed}-${i + 1}`;
  }

  const { data, error } = await supabase
    .from("merchants")
    .update({ slug: candidate })
    .eq("id", cur.id)
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id, slug: candidate };
}

// Tags relation (assuming tables: tags, store_tags [merchant_id, tag_id] unique)
export async function getTagIdBySlug(slug) {
  const s = toSlug(slug);
  if (!s) return null;
  const { data, error } = await supabase
    .from("tags")
    .select("id")
    .eq("slug", s)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}

export async function ensureStoreTagRelation(merchantId, tagId) {
  const { data: existing, error: ge } = await supabase
    .from("tag_stores")
    .select("merchant_id, tag_id")
    .eq("merchant_id", merchantId)
    .eq("tag_id", tagId)
    .maybeSingle();
  if (ge) throw ge;
  if (existing) return { created: 0 };

  const { error } = await supabase
    .from("tag_stores")
    .insert({ merchant_id: merchantId, tag_id: tagId });
  if (error) throw error;
  return { created: 1 };
}

// Coupons/Deals (assuming table: coupons)
export async function insertCouponDeal(merchantId, payload) {
  const row = {
    merchant_id: merchantId,
    coupon_type: payload.coupon_type, // 'coupon' | 'deal'
    coupon_code: payload.coupon_code || null,
    title: payload.title,
    description: payload.descp || "",
    type_text: payload.type_text || "",
    is_editor: !!payload.is_editor,
    is_publish: false,
  };
  const { data, error } = await supabase
    .from("coupons")
    .insert(row)
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

// Optional idempotent upsert for coupons
export async function upsertCouponDealByNaturalKey(merchantId, payload) {
  const key = {
    merchant_id: merchantId,
    coupon_type: payload.coupon_type,
    title: payload.title,
    coupon_code:
      payload.coupon_type === "coupon" ? payload.coupon_code || "" : "",
  };

  const { data: existing, error: ge } = await supabase
    .from("coupons")
    .select("id")
    .eq("merchant_id", key.merchant_id)
    .eq("coupon_type", key.coupon_type)
    .eq("title", key.title)
    .eq("coupon_code", key.coupon_code)
    .maybeSingle();
  if (ge) throw ge;

  const patch = {
    description: payload.descp || "",
    type_text: payload.type_text || "",
    is_editor: !!payload.is_editor,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("coupons")
      .update(patch)
      .eq("id", existing.id)
      .select("id")
      .single();
    if (error) throw error;
    return { action: "update", id: data.id };
  } else {
    const row = { ...key, ...patch, is_publish: false };
    const { data, error } = await supabase
      .from("coupons")
      .insert(row)
      .select("id")
      .single();
    if (error) throw error;
    return { action: "insert", id: data.id };
  }
}
