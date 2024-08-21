const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  login,
  getProfile,
  sendForgotPasswordCode,
  validateForgotPasswordCode,
  resetPassword,
  editClientProfile,
  editDoctorProfile,
  updatePassword,
  registerClient,
  checkClient,
  bookAppointment,
  recentBookings,
  recentPrescriptions,
  inQueueRequests,
  selectPlan,
  getPlans,
  getForm,
  getAppointment,
  getSlots,
  getAllDoc,
  getServiceTypes,
  getAllAppointments,
  appointmentStatus,
  inQueueEvaluation,
  submitEvaluation,
  submitPrescription,
  submitDiagnosis,
  completedReq,
  getPrescription,
  getEvaluation,
  getDrillDetails,
  drillUpdate,
  getTrainigSessionModel,
  buyTrainingSession,
  updateDrill,
  offlineDrillForm,
  getOfflineDrills,
  submitOfflineDrills,
  saveSessions,
  getAllSessions,
  getDrillsAllInputs,
} = require("../controllers/userController");

const router = express.Router();

router.route("/training-session").get(auth, getTrainigSessionModel);

router.post("/login", login);
router.post("/send-forgot-password-code", sendForgotPasswordCode);
router.post("/validate-code", validateForgotPasswordCode);
router.post("/new-client-registration", auth, registerClient);
router.post("/existing-client-verification", auth, checkClient);
router.post("/book-appointment/:id", bookAppointment); //authorization removed
router.post("/submit-eval-form", auth, submitEvaluation);
router.post("/submit-pres-form", auth, submitPrescription);
router.post("/submit-diagnosis-form", auth, submitDiagnosis);
router.post("/buy-training-session", auth, buyTrainingSession);

router.get("/get-slots", auth, getSlots);
router.get("/get-Drills", auth, getDrillDetails);
router.get("/get-prescriptions", auth, getPrescription);
router.get("/get-evaluations", auth, getEvaluation);
router.get("/get-plans", auth, getPlans);
router.get("/get-completed-req", auth, completedReq);
router.get("/get-profile", auth, getProfile);
router.get("/recent-bookings", auth, recentBookings);
router.get("/recent-prescriptions", auth, recentPrescriptions);
router.get("/in-queue-requests", auth, inQueueRequests);
router.get("/in-queue-evaluations", auth, inQueueEvaluation);
router.get("/get-form", auth, getForm);
router.get("/appointments/:date", auth, getAppointment);
router.get("/get-all-doctors", auth, getAllDoc);
router.get("/getServiceTypes", auth, getServiceTypes);
router.get("/get-all-appointments", auth, getAllAppointments);
router.get("/get-offlineDrills", getOfflineDrills);

router.put("/update-offline-drill", updateDrill);
router.put("/reset-password", resetPassword);
router.put("/update-drill", auth, drillUpdate);
router.put("/select-plan", auth, selectPlan);
router.put("/update-profile-client", auth, editClientProfile);
router.put("/update-profile-doctor", auth, editDoctorProfile);
router.put("/update-password", auth, updatePassword);
router.put("/update-status-appointment", auth, appointmentStatus);

router.post("/offlineDrillForm", offlineDrillForm);
router.post("/submitOfflineDrill", submitOfflineDrills);

router.post("/offline-drill", saveSessions);
router.get("/offline-drill/:cid/:aid", getAllSessions);
router.get("/drill_inputs/", getDrillsAllInputs);

module.exports = router;
