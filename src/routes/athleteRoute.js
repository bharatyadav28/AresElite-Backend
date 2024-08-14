const express = require("express");
const {
  login,
  register,
  sendForgotPasswordCode,
  validateForgotPasswordCode,
  resetPassword,
  getProfile,
  editProfile,
  getUpcomingAppointments,
  getBookings, getTransactions, dashboard, shipment, recentBookings, getPrescription
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.get("/get-profile", auth, getProfile);
router.route('/transaction').get(auth, getTransactions);
router.get("/get-bookings", auth, getBookings);
router.get("/upcoming-appointments", auth, getUpcomingAppointments);
router.get("/recent-bookings", auth, recentBookings);

router.route('/prescription').get(auth, getPrescription);

router.put("/reset-password", auth, resetPassword);
router.put("/edit-profile", auth, editProfile);
router.route('/dashboard').get(auth, dashboard);

router.route('/shipment').get(auth, shipment);


module.exports = router;
