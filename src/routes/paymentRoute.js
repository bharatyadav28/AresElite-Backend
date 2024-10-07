const express = require("express");
const { auth } = require("../middlewares/auth");
const { createPaymentIntent, updatePayment, cancelTransactionWithStripe } = require("../controllers/paymentHandler");
const router = express.Router();

router.post('/createPaymentIntent', auth, createPaymentIntent);
router.put('/updatePayment', auth, updatePayment);
router.delete('/cancelSubscription/:id', auth, cancelTransactionWithStripe)
module.exports = router;