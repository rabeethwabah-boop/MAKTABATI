import { Router } from "express";

const router = Router();

// @ts-ignore
router.get("/healthz", (req, res) => {
  res.json({ status: "ok" });
});

export default router;
