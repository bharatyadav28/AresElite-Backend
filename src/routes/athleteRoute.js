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
  cancelBooking,
  getBookings,
  getTransactions,
  dashboard,
  shipment,
  recentBookings,
  getPrescription,
  alreadyBookedAppointment,
  updateProfilePic,
} = require("../controllers/atheleteController");
const { auth } = require("../middlewares/auth");
const { upload } = require("../utils/aws");

const router = express.Router();

router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/register", register);
router.post("/login", login);

router.get("/get-profile", auth, getProfile);
router.route("/transaction").get(auth, getTransactions);
router.get("/get-bookings", auth, getBookings);
router.get("/upcoming-appointments", auth, getUpcomingAppointments);
router.get("/recent-bookings", auth, recentBookings);

router.route("/prescription").get(auth, getPrescription);

router.put("/reset-password", auth, resetPassword);
router.put("/edit-profile", auth, editProfile);
router.put("/update-profile-pic", upload.any(), auth, updateProfilePic);
router.route("/dashboard").get(auth, dashboard);

router.route("/shipment").get(auth, shipment);

router.get("/cancel-booking/:id", auth, cancelBooking);
router.get("/already-booked/:uid", auth, alreadyBookedAppointment);

module.exports = router;
