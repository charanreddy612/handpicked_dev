import { Router } from "express";
import * as publicCategories from "../controllers/publicCategories.js";
import * as publicStores from "../controllers/publicStores.js";
import * as publicCoupons from "../controllers/publicCoupons.js";
import * as publicBlogs from "../controllers/publicBlogs.js";
import * as publicSearch from "../controllers/publicSearch.js";
import * as publicHealth from "../controllers/publicHealth.js";
import { stores as sitemapStores, blogs as sitemapBlogs } from "../controllers/publicSitemaps.js";

const publicRouter = Router();

// Categories
publicRouter.get("/public/v1/categories", publicCategories.list);

// Stores
publicRouter.get("/public/v1/stores", publicStores.list);
publicRouter.get("/public/v1/stores/:slug", publicStores.detail);

// Coupons
publicRouter.get("/public/v1/coupons", publicCoupons.list);

// Blogs
publicRouter.get("/public/v1/blogs", publicBlogs.list);
publicRouter.get("/public/v1/blogs/:slug", publicBlogs.detail);

// Search
publicRouter.get("/public/v1/search", publicSearch.search);

// Health
publicRouter.get("/public/v1/health", publicHealth.health);

//Sitemaps
publicRouter.get("/v1/sitemaps/stores.xml", sitemapStores);
publicRouter.get("/v1/sitemaps/blogs.xml", sitemapBlogs);

export default publicRouter;
