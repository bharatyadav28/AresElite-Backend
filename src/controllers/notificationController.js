const notificationModel = require("../models/notificationModel");
const catchAsyncError = require("../utils/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const jwt = require('jsonwebtoken');

exports.getAllNotifications = catchAsyncError(async (req, res) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  const notifications = await notificationModel.find({ user: userId });
  const unreadCounts = await notificationModel.countDocuments({ user: userId, seen: false });
  res.status(200).json({ notifications, unreadCounts });
});

exports.getNotification = catchAsyncError(async (req, res, next) => {

  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  const {
    params: { id },
  } = req;
  if (!id) {
    return next(new ErrorHandler("Please provide notification id", 400));
  }

  const notification = await notificationModel.findOne({
    user: userId,
    _id: id,
  });
  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  res.status(200).json({ notification });
});

exports.updateNotification = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  const {
    params: { id },
  } = req;
  if (!id) {
    return next(ErrorHandler("Please provide Notification id in params"), 400);
  }
  const notification = await notificationModel.findOne({
    _id: id,
    user: userId,
  });

  if (!notification) {
    return next(new ErrorHandler("Notification not found", 404));
  }

  notification.seen = true;
  await notification.save();
  res.status(200).json({ message: "Notification marked as seen" });
});

exports.markAllRead = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  await notificationModel.updateMany(
    { user: userId },
    { seen: true }
  );
  res.status(200).json({ success: true });
});

exports.deleteNotification = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new ErrorHandler("Please provide Notification id in params"), 400);
  }
  const deleted = await notificationModel.findByIdAndDelete(id);
  if (!deleted) {
    return next(new ErrorHandler("Notification not found", 404));
  }
  res.status(200).json({ message: "Notification Deleted Successfully" });
});