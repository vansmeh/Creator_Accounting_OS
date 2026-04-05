import { Router } from "express";
import { createInvoice, getInvoice, getInvoices, updateInvoice } from "../controllers/invoiceController.js";

const router = Router();

router.get("/",     getInvoices);
router.post("/",    createInvoice);
router.get("/:id",  getInvoice);
router.put("/:id",  updateInvoice);

export default router;
