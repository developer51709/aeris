import { Router, Request, Response } from "express";
import meilisearch from "meilisearch";

const router = Router();

const client = new meilisearch({
  host: process.env.MEILI_HOST ?? "http://127.0.0.1:7700",
  apiKey: process.env.MEILI_API_KEY ?? "",
});

const INDEX = process.env.MEILI_INDEX ?? "aeris-docs";

router.get("/docs/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string) ?? "";
  const page = Math.max(1, Number(req.query.page ?? 1));
  const limit = Math.min(20, Math.max(1, Number(req.query.limit ?? 10)));

  try {
    const results = await client.index(INDEX).search(q, {
      limit: limit,
      offset: (page - 1) * limit,
      attributesToHighlight: ["title", "content"],
    });

    return res.json({
      results: results.hits,
      totalHits: results.estimatedTotalHits ?? 0,
      page,
      limit,
    });
  } catch (error) {
    console.error("Meilisearch error:", error);
    return res.status(500).json({ error: "Search failed" });
  }
});

router.get("/docs", async (_req: Request, res: Response) => {
  try {
    const allDocs = await client
      .index(INDEX)
      .getDocuments({ limit: 1000 })
      .catch(() => []);

    return res.json({ docs: allDocs });
  } catch (error) {
    console.error("Meilisearch error:", error);
    return res.status(500).json({ error: "Failed to fetch docs" });
  }
});

export { router as searchRoutes };
