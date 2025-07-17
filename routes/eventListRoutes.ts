import express from "express";
import { getFilteredEvents } from "../controllers/eventListController";

const router = express.Router();

router.get("/", getFilteredEvents);

export default router;
