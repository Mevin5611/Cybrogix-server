import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import {
  createOrder,
  getAllOrders,
  newPayment,
  sendStripePublishibleKey,
} from "../controllers/order.controller";
const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);
orderRouter.get(
  "/get-all-orders",
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);
orderRouter.get("/payment/stripepublishablekey",isAuthenticated,sendStripePublishibleKey);
orderRouter.post("/payment", isAuthenticated, newPayment);

export default orderRouter;
