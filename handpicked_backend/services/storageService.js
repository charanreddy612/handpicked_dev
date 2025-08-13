// src/services/storage.service.js
import { supabase } from "../dbhelper/dbclient.js";

const BUCKET = "tag-images"; // ✅ Your public bucket
const FOLDER = "tags"; // ✅ Folder inside bucket

export async function uploadTagImageBuffer(buffer, filename, mimetype) {
  const now = new Date();
  const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}`;
  const safeName = filename.toLowerCase().replace(/\s+/g, "-");
  const path = `${FOLDER}/${datePath}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, {
      contentType: mimetype || "application/octet-stream",
      upsert: false,
    });

  if (uploadError) return { url: null, error: uploadError };

  const { data: pubData } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { url: pubData?.publicUrl || null, error: null, path };
}

export async function deleteByPublicUrl(publicUrl) {
  if (!publicUrl) return { error: null };
  try {
    const url = new URL(publicUrl);
    const marker = `/storage/v1/object/public/${BUCKET}/`;
    const idx = url.pathname.indexOf(marker);
    if (idx === -1) return { error: null };
    const objectPath = decodeURIComponent(url.pathname.slice(idx + marker.length));

    const { error } = await supabase.storage.from(BUCKET).remove([objectPath]);
    return { error };
  } catch {
    return { error: null };
  }
}