// src/dbhelper/MerchantCategoryRepo.js
import { supabase } from "../dbhelper/dbclient.js";

// Slug helpers
const toSlug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export async function ensureUniqueSlug(base) {
  const seed = toSlug(base || "category");
  let slug = seed;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("merchant_categories")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return slug;
    slug = `${seed}-${i + 1}`;
  }
  return `${seed}-${Date.now()}`;
}

export async function ensureUniqueSlugOnUpdate(id, proposed) {
  const seed = toSlug(proposed || "category");
  let slug = seed;
  for (let i = 0; i < 50; i++) {
    const { data, error } = await supabase
      .from("merchant_categories")
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

// List with filters + pagination
export async function list({
  name = "",
  show_home,
  show_deals_page,
  is_publish,
  is_header,
  page = 1,
  limit = 20,
} = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const selectCols = `
    id,
    name,
    slug,
    show_home,
    show_deals_page,
    is_publish,
    is_header,
    created_at
  `;

  // Count
  let countQ = supabase
    .from("merchant_categories")
    .select("id", { count: "exact", head: true });
  if (name) countQ = countQ.ilike("name", `%${name}%`);
  if (show_home !== undefined) countQ = countQ.eq("show_home", !!show_home);
  if (show_deals_page !== undefined)
    countQ = countQ.eq("show_deals_page", !!show_deals_page);
  if (is_publish !== undefined) countQ = countQ.eq("is_publish", !!is_publish);
  if (is_header !== undefined) countQ = countQ.eq("is_header", !!is_header);
  const { count, error: countErr } = await countQ;
  if (countErr) throw countErr;

  // Data
  let q = supabase
    .from("merchant_categories")
    .select(selectCols)
    .order("created_at", { ascending: false })
    .range(from, to);
  if (name) q = q.ilike("name", `%${name}%`);
  if (show_home !== undefined) q = q.eq("show_home", !!show_home);
  if (show_deals_page !== undefined)
    q = q.eq("show_deals_page", !!show_deals_page);
  if (is_publish !== undefined) q = q.eq("is_publish", !!is_publish);
  if (is_header !== undefined) q = q.eq("is_header", !!is_header);

  const { data, error } = await q;
  if (error) throw error;

  return { rows: data || [], total: count || 0 };
}

// Detail
export async function getById(id) {
  const selectCols = `
    id,
    name,
    slug,
    description,
    meta_title,
    meta_keywords,
    meta_description,
    parent_id,
    top_banner_link_url,
    side_banner_link_url,
    show_home,
    show_deals_page,
    is_publish,
    is_header,
    thumb_url,
    top_banner_url,
    side_banner_url,
    created_at,
    updated_at
  `;
  const { data, error } = await supabase
    .from("merchant_categories")
    .select(selectCols)
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// Insert
export async function insert(payload) {
  const toInsert = { ...payload };
  const { data, error } = await supabase
    .from("merchant_categories")
    .insert(toInsert)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Update (drops undefined)
export async function update(id, patch) {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([_, v]) => v !== undefined)
  );
  if (Object.keys(clean).length === 0) {
    return await getById(id);
  }
  const { data, error } = await supabase
    .from("merchant_categories")
    .update(clean)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Toggle publish
export async function toggleStatus(id) {
  const { data: cur, error: ge } = await supabase
    .from("merchant_categories")
    .select("is_publish")
    .eq("id", id)
    .single();
  if (ge) throw ge;
  const next = !cur?.is_publish;
  const { data, error } = await supabase
    .from("merchant_categories")
    .update({ is_publish: next })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Delete
export async function remove(id) {
  const { error } = await supabase
    .from("merchant_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return true;
}