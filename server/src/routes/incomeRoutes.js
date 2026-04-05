import { Router } from "express";
import { createIncome, getIncome, deleteIncome } from "../controllers/incomeController.js";

const router = Router();

router.get("/",     getIncome);
router.post("/",    createIncome);
router.delete("/:id", deleteIncome);

export default router;
