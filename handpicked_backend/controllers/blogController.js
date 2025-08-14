import * as blogRepo from "../dbhelper/BlogRepo.js";
import { uploadImageBuffer, deleteImageByPublicUrl } from "../services/storageService.js";

const BUCKET = "blog-images";
const FOLDER = "blogs";

const toBool = (v) => v === true || v === "true" || v === 1 || v === "1";

const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");

export async function listBlogs(req, res) {
  try {
    const { title } = req.query;
    const rows = await blogRepo.list({ title: title || null });
    return res.json({ data: rows, error: null });
  } catch (err) {
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}

export async function getBlog(req, res) {
  try {
    const blog = await blogRepo.getById(req.params.id);
    if (!blog) return res.status(404).json({ data: null, error: { message: "Not found" } });
    return res.json({ data: blog, error: null });
  } catch (err) {
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}

export async function createBlog(req, res) {
  try {
    console.log('BODY:', req.body);
    console.log('FILES:', req.files); 
    const body = req.body || {};
    if (!body.title) return res.status(400).json({ data: null, error: { message: "Title is required" } });

    let slug = body.slug ? slugify(body.slug) : slugify(body.title);
    slug = await blogRepo.ensureUniqueSlug(slug);

    const featured_thumb_url = req.files?.featured_thumb
      ? (await uploadImageBuffer(BUCKET, FOLDER, req.files.featured_thumb.data, req.files.featured_thumb.name, req.files.featured_thumb.mimetype)).url
      : null;

    const featured_image_url = req.files?.featured_image
      ? (await uploadImageBuffer(BUCKET, FOLDER, req.files.featured_image.data, req.files.featured_image.name, req.files.featured_image.mimetype)).url
      : null;

    const created = await blogRepo.insert({
      title: body.title,
      slug,
      content: body.content || "",
      meta_title: body.meta_title || "",
      meta_keywords: body.meta_keywords || "",
      meta_description: body.meta_description || "",
      featured_thumb_url,
      featured_image_url,
      is_publish: toBool(body.is_publish),
      is_featured: toBool(body.is_featured),
      is_top: toBool(body.is_top),
      top_category_name: body.top_category_name || null,
      category_order: body.category_order ? Number(body.category_order) : null,
      blogs_count: body.blogs_count ? Number(body.blogs_count) : 0,
    });

    return res.json({ data: created, error: null });
  } catch (err) {
    console.error("Create Blog Error:", err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}

export async function updateBlog(req, res) {
  try {
    const { id } = req.params;
    const b = req.body || {};

    const patch = {
      title: b.title,
      content: b.content,
      meta_title: b.meta_title,
      meta_keywords: b.meta_keywords,
      meta_description: b.meta_description,
      is_publish: b.is_publish !== undefined ? toBool(b.is_publish) : undefined,
      is_featured: b.is_featured !== undefined ? toBool(b.is_featured) : undefined,
      is_top: b.is_top !== undefined ? toBool(b.is_top) : undefined,
      top_category_name: b.top_category_name,
      category_order: b.category_order !== undefined ? Number(b.category_order) : undefined,
      blogs_count: b.blogs_count !== undefined ? Number(b.blogs_count) : undefined,
    };

    if (b.slug) {
      patch.slug = await blogRepo.ensureUniqueSlugOnUpdate(id, slugify(b.slug));
    }

    if (req.files?.featured_thumb) {
      patch.featured_thumb_url = (await uploadImageBuffer(BUCKET, FOLDER, req.files.featured_thumb.data, req.files.featured_thumb.name, req.files.featured_thumb.mimetype)).url;
    }

    if (req.files?.featured_image) {
      patch.featured_image_url = (await uploadImageBuffer(BUCKET, FOLDER, req.files.featured_image.data, req.files.featured_image.name, req.files.featured_image.mimetype)).url;
    }

    const updated = await blogRepo.update(id, patch);
    return res.json({ data: updated, error: null });
  } catch (err) {
    console.error("Update Blog Error:", err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}

export async function updateBlogStatus(req, res) {
  try {
    const updated = await blogRepo.update(req.params.id, { is_publish: toBool(req.body.is_publish) });
    return res.json({ data: updated, error: null });
  } catch (err) {
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}

export async function deleteBlog(req, res) {
  try {
    const { id } = req.params;
    await blogRepo.remove(id);
    return res.json({ data: { id: Number(id) }, error: null });
  } catch (err) {
    console.error("Delete Blog Error:", err);
    return res.status(500).json({ data: null, error: { message: err.message } });
  }
}
