import { Router } from "express";
import { getRank, postComplete } from "../controllers/rankController";
// import { authMiddleware } from "../middleware/auth"; // jeśli masz JWT

const router = Router();

// router.use(authMiddleware);

router.get("/users/:userId/rank", getRank);
router.post("/users/:userId/rank/complete", postComplete);

export default router;
