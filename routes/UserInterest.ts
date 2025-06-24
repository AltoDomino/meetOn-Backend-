import express from "express";
import {
  saveInterestsController,
  getInterestsController
} from "../controllers/UserInterest"

const router = express.Router();

router.post("/", saveInterestsController); 
router.get("/:userId", getInterestsController); 

export default router;
