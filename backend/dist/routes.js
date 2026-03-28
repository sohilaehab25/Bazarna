"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./controllers/auth/auth.routes"));
const user_routes_1 = __importDefault(require("./controllers/users/user.routes"));
const product_routes_1 = __importDefault(require("./controllers/products/product.routes"));
const order_routes_1 = __importDefault(require("./controllers/orders/order.routes"));
const category_routes_1 = __importDefault(require("./controllers/categories/category.routes"));
const router = (0, express_1.Router)();
// Mount routes
router.use('/auth', auth_routes_1.default);
router.use('/users', user_routes_1.default);
router.use('/products', product_routes_1.default);
router.use('/orders', order_routes_1.default);
router.use('/categories', category_routes_1.default);
exports.default = router;
