import { supabase } from "../dbhelper/dbclient.js";

// ===== List with optional title filter =====
export async function list({ title }) {
  let query = supabase
    .from("blogs")
    .select(
      `
      id,
      title,
      top_category_name,
      category_order,
      blogs_count,
      is_publish,
      is_featured,
      is_top,
      featured_thumb_url,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (title) {
    query = query.ilike("title", `%${title}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// ===== Get by ID =====
export async function getById(id) {
  const { data, error } = await supabase
    .from("blogs")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

// ===== Insert new blog =====
export async function insert(blog) {
  const { data, error } = await supabase
    .from("blogs")
    .insert([blog])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== Update existing blog =====
export async function update(id, patch) {
  // Remove undefined values so we don't overwrite unintentionally
  const cleanPatch = {};
  Object.keys(patch).forEach((k) => {
    if (patch[k] !== undefined) cleanPatch[k] = patch[k];
  });

  const { data, error } = await supabase
    .from("blogs")
    .update(cleanPatch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ===== Delete blog =====
export async function remove(id) {
  const { error } = await supabase.from("blogs").delete().eq("id", id);
  if (error) throw error;
  return true;
}

// ===== Ensure unique slug when creating =====
export async function ensureUniqueSlug(baseSlug) {
  if (!baseSlug) baseSlug = "post";
  let slug = baseSlug;
  let i = 1;

  while (true) {
    const { data, error } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug; // slug is unique
    slug = `${baseSlug}-${i}`;
    i++;
  }
}

// ===== Ensure unique slug when updating =====
export async function ensureUniqueSlugOnUpdate(id, proposedSlug) {
  if (!proposedSlug) return proposedSlug;

  // Allow same slug for the same record
  const { data: same, error: errSame } = await supabase
    .from("blogs")
    .select("id")
    .eq("id", id)
    .eq("slug", proposedSlug)
    .maybeSingle();

  if (errSame) throw errSame;
  if (same) return proposedSlug;

  // Otherwise, ensure uniqueness
  let slug = proposedSlug;
  let i = 1;
  while (true) {
    const { data, error } = await supabase
      .from("blogs")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) return slug;
    slug = `${proposedSlug}-${i}`;
    i++;
  }
}
