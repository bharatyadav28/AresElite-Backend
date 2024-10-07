const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/aws");
const {
  registerDoctor,
  registerAdmin,
  login,
  getAllDoc,
  prescriptionFormMake,
  evaluationFormMake,
  registerClinic,
  getAllClinics,
  addSlot,
  getAllSlots,
  delDoc,
  delUser,
  editDoc,
  addService,
  getService,
  editService,
  delService,
  addplan,
  registerAthlete,
  getAllUsers,
  activateUser,
  activateClinic,
  getBookingsByDoctor,
  saveForm,
  fetchForm,
  createDrillForm,
  getPlan,
  updatePlan,
  getForms,
  delSlot,
  updateUser,
  getDrillDetails,
  delClinic,
  updateClinic,
  getClinicStatus,
  uploadXFile,
  deleteXFile,
  shipmentDetailer,
  getShipments,
  updateShipment,
  updateDrill,
  deleteShipment,
  deleteDrill,
  updateSlot,
  getTransactions,
  updateTransaction,
  getBookings,
  updateBooking,
  AddtermsAndConditions,
  DeletetermsAndConditions,
  getTermsAndConditions,
  AddPrivacyPolicy,
  DeletePrivacyPolicy,
  getPrivacyPolicy,
  dashboard,
  createDrillName,
  updateDynamicDrill,
  deleteDynamicDrill,
  getDynamicDrills,
  createColumn,
  updateColumn,
  deleteColumn,
  getColumns,
  getAllShipmentUsers,
  addPlan,
  getSinglePlan,
} = require("../controllers/adminController");

const {
  getTrainigSessionModel,
  createTrainigSessionModel,
  updateTrainingSessionModel,
  deleteTrainingSessionModel,
} = require("../controllers/userController");

const router = express.Router();

router
  .route("/training-session")
  .get(auth, isAdmin, getTrainigSessionModel)
  .post(auth, isAdmin, createTrainigSessionModel)
  .put(auth, isAdmin, updateTrainingSessionModel)
  .delete(auth, isAdmin, deleteTrainingSessionModel);

router.post("/login", login);
router.post("/save_form", auth, isAdmin, saveForm);
router.get("/fetch_form", auth, isAdmin, fetchForm);
router.post("/register_admin", registerAdmin);
router.post("/register_doctor", auth, isAdmin, registerDoctor);
router.post("/register_athlete", auth, isAdmin, registerAthlete);
router.post("/register_clinic", auth, isAdmin, registerClinic);
router.post("/set_pres_form", auth, isAdmin, prescriptionFormMake);
router.post("/set_eval_form", auth, isAdmin, evaluationFormMake);
router.post("/add_slot", auth, isAdmin, addSlot);
router.post("/set_drillform_form", auth, isAdmin, createDrillForm);
router.post("/upload_file", upload.any(), auth, isAdmin, uploadXFile);
router.delete("/delete_file", deleteXFile);

router.route("/dashboard").get(auth, isAdmin, dashboard);

router
  .route("/terms_and_conditions")
  .post(auth, isAdmin, AddtermsAndConditions)
  .delete(auth, isAdmin, DeletetermsAndConditions)
  .get(auth, getTermsAndConditions);

router
  .route("/privacy_policy")
  .post(auth, isAdmin, AddPrivacyPolicy)
  .delete(auth, isAdmin, DeletePrivacyPolicy)
  .get(auth, getPrivacyPolicy);

router
  .route("/shipment")
  .post(auth, isAdmin, shipmentDetailer)
  .get(auth, isAdmin, getShipments)
  .put(auth, isAdmin, updateShipment)
  .delete(auth, isAdmin, deleteShipment);

router
  .route("/transaction")
  .get(auth, isAdmin, getTransactions)
  .put(auth, isAdmin, updateTransaction);

router
  .route("/service")
  .post(auth, isAdmin, addService)
  .put(auth, isAdmin, editService)
  .get(auth, isAdmin, getService)
  .delete(auth, isAdmin, delService);

router
  .route("/plans")
  .put(auth, isAdmin, updatePlan)
  .get(auth, isAdmin, getPlan)
  .post(auth, addPlan)

router.get("/plan/:id", getSinglePlan)

router
  .route("/drill")
  .get(auth, isAdmin, getDrillDetails)
  .put(auth, isAdmin, updateDrill)
  .delete(auth, isAdmin, deleteDrill);

router
  .route("/bookings")
  .get(auth, isAdmin, getBookings)
  .put(auth, isAdmin, updateBooking);

router.delete("/delete_user", auth, isAdmin, delUser);
router.delete("/delete_slot", auth, isAdmin, delSlot);

router.route("/slot").put(auth, isAdmin, updateSlot);

router.get("/make_active_user", auth, isAdmin, activateUser);
router.get("/get_all_form", auth, isAdmin, getForms);
router.get("/make_active_clinic", auth, isAdmin, activateClinic);
router.get("/get_bookings_by_doc", auth, isAdmin, getBookingsByDoctor);
router.get("/get_all_doctor", auth, isAdmin, getAllDoc);
router.get("/get_all_clinics", auth, isAdmin, getAllClinics);
router.get("/get_all_slots", auth, isAdmin, getAllSlots);
router.get("/get_all_users", auth, isAdmin, getAllUsers);
router.get("/get_all_shipment_users", auth, isAdmin, getAllShipmentUsers);
router.get("/clinic_status", auth, isAdmin, getClinicStatus);

router.delete("/delete_doc", auth, isAdmin, delDoc);
router.delete("/delete_clinic", auth, isAdmin, delClinic);
router.put("/edit_doc", auth, isAdmin, editDoc);
router.put("/update_user", auth, isAdmin, updateUser);
router.put("/update_clinic", auth, isAdmin, updateClinic);

router
  .route("/dynamic-drills")
  .get(auth, isAdmin, getDynamicDrills)
  .post(auth, isAdmin, createDrillName);

router
  .route("/dynamic-drills/:id")
  .put(auth, isAdmin, updateDynamicDrill)
  .delete(auth, isAdmin, deleteDynamicDrill);

router
  .route("/dynamic-drills/col")
  .get(auth, isAdmin, getColumns)
  .post(auth, isAdmin, createColumn);

router
  .route("/dynamic-drills/col/:id")
  .put(auth, isAdmin, updateColumn)
  .delete(auth, isAdmin, deleteColumn);

module.exports = router;
