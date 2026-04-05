import { Router } from "express";
import {
  getDeals, getDeal, createDeal, updateDeal, deleteDeal, markFollowUp, addNote,
} from "../controllers/dealController.js";

const router = Router();

router.get("/",            getDeals);
router.post("/",           createDeal);
router.get("/:id",         getDeal);
router.put("/:id",         updateDeal);
router.delete("/:id",      deleteDeal);
router.put("/:id/followup",markFollowUp);
router.post("/:id/notes",  addNote);

export default router;
