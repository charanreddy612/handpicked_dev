// src/dbhelper/MerchantRepo.js
import { supabase } from "../dbhelper/dbclient.js";

// Normalize slug
const toSlug = (s) =>
  String(s || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Ensure unique slug on create
export async function ensureUniqueSlug(base) {
  const seed = toSlug(base || "merchant");
  let slug = seed;
  let i = 0;
  // Try until unique; cap attempts
  while (i < 50) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", slug)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return slug;
    i += 1;
    slug = `${seed}-${i}`;
  }
  return `${seed}-${Date.now()}`;
}

// Ensure unique slug on update (exclude current id)
export async function ensureUniqueSlugOnUpdate(id, proposed) {
  const seed = toSlug(proposed || "merchant");
  let slug = seed;
  let i = 0;
  while (i < 50) {
    const { data, error } = await supabase
      .from("merchants")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .limit(1);
    if (error) throw error;
    if (!data || data.length === 0) return slug;
    i += 1;
    slug = `${seed}-${i}`;
  }
  return `${seed}-${Date.now()}`;
}

// List with filters + pagination
export async function list({ name = "", page = 1, limit = 20 } = {}) {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Base select for list view
  const selectCols =
    "id, name, slug, is_publish, views, created_at, logo_url, top_banner_url, side_banner_url";

  // Count total (exact) with the same filter
  let countQuery = supabase.from("merchants").select("id", { count: "exact", head: true });
  if (name) countQuery = countQuery.ilike("name", `%${name}%`);
  const { count, error: countErr } = await countQuery;
  if (countErr) throw countErr;

  // Data query
  let query = supabase.from("merchants").select(selectCols).order("created_at", { ascending: false }).range(from, to);
  if (name) query = query.ilike("name", `%${name}%`);

  const { data, error } = await query;
  if (error) throw error;

  return { rows: data || [], total: count || 0 };
}

export async function getById(id) {
  const selectCols = `
    id,
    name,
    slug,
    description,
    meta_title,
    meta_keywords,
    meta_description,
    website,
    email,
    phone,
    show_home,
    show_deals_page,
    is_publish,
    is_header,
    logo_url,
    top_banner_url,
    side_banner_url,
    views,
    created_at,
    updated_at
  `;
  const { data, error } = await supabase.from("merchants").select(selectCols).eq("id", id).single();
  if (error) throw error;
  return data;
}

// Insert
export async function insert(payload) {
  const toInsert = { ...payload };
  const { data, error } = await supabase.from("merchants").insert(toInsert).select().single();
  if (error) throw error;
  return data;
}

// Update (drops undefined keys)
export async function update(id, patch) {
  const clean = Object.fromEntries(
    Object.entries(patch).filter(([_, v]) => v !== undefined)
  );
  if (Object.keys(clean).length === 0) {
    return await getById(id);
  }
  const { data, error } = await supabase.from("merchants").update(clean).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Toggle status (active/inactive)
export async function toggleStatus(id) {
  // Load current is_publish
  const { data: cur, error: ge } = await supabase.from("merchants").select("is_publish").eq("id", id).single();
  if (ge) throw ge;
  const next = !cur?.is_publish;
  const { data, error } = await supabase.from("merchants").update({ is_publish: next }).eq("id", id).select().single();
  if (error) throw error;
  return data;
}

// Remove row
export async function remove(id) {
  const { error } = await supabase.from("merchants").delete().eq("id", id);
  if (error) throw error;
  return true;
}
