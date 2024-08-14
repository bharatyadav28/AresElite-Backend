const express = require("express");
const { auth } = require("../middlewares/auth");
const { createPaymentIntent, updatePayment } = require("../controllers/paymentHandler");
const router = express.Router();

router.post('/createPaymentIntent', auth, createPaymentIntent);
router.put('/updatePayment', auth, updatePayment);

module.exports = router;