import * as BlogsRepo from "../dbhelper/BlogsRepoPublic.js";
import { ok, fail, notFound } from "../utils/http.js";
import { withCache } from "../utils/cache.js";
import { buildCanonical } from "../utils/seo.js";
import {
  valPage,
  valLimit,
  valEnum,
  valLocale,
  deriveLocale,
} from "../utils/validation.js";
import { badRequest } from "../utils/errors.js";
import { buildArticleJsonLd } from "../utils/jsonld.js";

function getOrigin(req) {
  return (
    (req.headers["x-forwarded-proto"]
      ? String(req.headers["x-forwarded-proto"])
      : req.protocol) +
    "://" +
    req.get("host")
  );
}
function getPath(req) {
  return req.originalUrl ? req.originalUrl.split("?") : req.path;
}

// Build prev/next/total_pages navigation URLs
function buildPrevNext({ origin, path, page, limit, total, extraParams = {} }) {
  const totalPages = Math.max(Math.ceil((total || 0) / (limit || 1)), 1);
  const makeUrl = (p) => {
    const url = new URL(`${origin}${path}`);
    Object.entries({ ...extraParams, page: p, limit }).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== "")
        url.searchParams.set(k, String(v));
    });
    return url.toString();
  };
  const prev = page > 1 ? makeUrl(page - 1) : null;
  const next = page < totalPages ? makeUrl(page + 1) : null;
  return { prev, next, totalPages };
}

export async function list(req, res) {
  try {
    const page = valPage(req.query.page);
    const limit = valLimit(req.query.limit);
    const sort = valEnum(req.query.sort, ["latest", "featured"], "latest");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const categoryId = req.query.category_id
      ? Number(req.query.category_id)
      : null;
    if (req.query.category_id && !Number.isFinite(categoryId)) {
      return badRequest(res, "Invalid category_id");
    }
    const qRaw = String(req.query.q || "");
    const q = qRaw.length > 200 ? qRaw.slice(0, 200) : qRaw;
    const params = {
      q: q.trim(),
      categoryId,
      sort,
      locale,
      page,
      limit,
      origin: getOrigin(req),
      path: getPath(req),
    };

    const result = await withCache(
      req,
      async () => {
        const { rows, total } = await BlogsRepo.list(params);

        const nav = buildPrevNext({
          origin: params.origin,
          path: params.path,
          page,
          limit,
          total,
          extraParams: {
            q: params.q || undefined,
            category_id: params.categoryId || undefined,
            sort: params.sort,
            locale: params.locale || undefined,
          },
        });

        return {
          data: rows,
          meta: {
            page,
            limit,
            total,
            canonical: buildCanonical({ ...params }),
            prev: nav.prev,
            next: nav.next,
            total_pages: nav.totalPages,
          },
        };
      },
      { ttlSeconds: 60 }
    );

    return ok(res, result);
  } catch (e) {
    return fail(res, "Failed to list blogs", e);
  }
}

export async function detail(req, res) {
  try {
    const slug = String(req.params.slug || "")
      .trim()
      .toLowerCase();
    if (!slug) return badRequest(res, "Invalid blog slug");
    const locale = valLocale(req.query.locale) || deriveLocale(req);
    const params = {
      slug,
      locale,
      origin: getOrigin(req),
      path: getPath(req),
    };

    const result = await withCache(
      req,
      async () => {
        const blog = await BlogsRepo.getBySlug(slug);
        if (!blog) return { data: null, meta: { status: 404 } };

        const seo = BlogsRepo.buildSeo(blog, params);
        const breadcrumbs = BlogsRepo.buildBreadcrumbs(blog, params);

        // JSON-LD
        const articleJsonLd = buildArticleJsonLd(blog, params.origin);
        const breadcrumbJsonLd = {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: breadcrumbs.map((b, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: b.name,
            item: b.url,
          })),
        };

        const related = await BlogsRepo.related(blog, 6);

        return {
          data: {
            id: blog.id,
            slug: blog.slug,
            title: blog.title,
            hero_image_url: blog.hero_image_url,
            category: blog.category,
            author: blog.author,
            created_at: blog.created_at,
            updated_at: blog.updated_at,
            seo,
            breadcrumbs,
            content_html: blog.content_html,
            related,
          },
          meta: {
            canonical: buildCanonical({ ...params }),
            jsonld: { article: articleJsonLd, breadcrumb: breadcrumbJsonLd },
          },
        };
      },
      { ttlSeconds: 60 }
    );

    // Use standardized 404 response
    if (!result?.data) {
      return notFound(res, "Blog not found");
    }
    return ok(res, result);
  } catch (e) {
    return fail(res, "Failed to get blog detail", e);
  }
}
