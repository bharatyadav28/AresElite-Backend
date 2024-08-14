const express = require("express");
const router = express.Router();
const { auth } = require("../middlewares/auth");
const {
  getAllNotifications,
  markAllRead,
  getNotification,
  deleteNotification,
  updateNotification,
  generateNotification,
} = require("../controllers/notificationController");

// router.get("/create-default", auth, generateNotification);
router.get("/get-all", auth, getAllNotifications);
router.put("/mark-all-read", auth, markAllRead);
router
  .route("/:id")
  .get(auth, getNotification)
  .delete(auth, deleteNotification)
  .put(auth, updateNotification);

module.exports = router;
