const userModel = require("../models/userModel");
const appointmentModel = require("../models/appointmentModel");
const Stripe = require("stripe");
const dayjs = require("dayjs");
const stripe = Stripe(process.env.SECRET);
const slotModel = require("../models/slotModel");
const catchAsyncError = require("../utils/catchAsyncError");
const mongoose = require("mongoose");
const ErrorHandler = require("../utils/errorHandler");
const { resetPasswordCode, newAccount } = require("../utils/mails");
const generateCode = require("../utils/generateCode");
const jwt = require("jsonwebtoken");
const { generateAppointmentId } = require("../utils/generateId");
const {
  calculateTimeDifference,
  sendData,
  filterBookedSlots,
  timeDiff,
  convertTo24HourFormat,
  sortServices,
  formatTime,
} = require("../utils/functions");
const ServiceTypeModel = require("../models/ServiceTypeModel.js");
const planModel = require("../models/planModel.js");
const moment = require("moment");
const EvalForm = require("../models/FormModel");

const EvalutionsForm = require("../models/EvaluationForms");
const PrescriptionsForm = require("../models/PrescriptionForm.js");
const DiagnosisForm = require("../models/DiagnosisForm.js");
const DrillForm = require("../models/DrillFormModel.js");
const DrillFormModel = require("../models/DrillModel.js");
const { createNotification, timeForService } = require("../utils/functions");
const { paymentMail } = require("../utils/mails.js");
const transactionModel = require("../models/transactionModel.js");
const TrainingSessionModel = require("../models/trainingSessionModel.js");
const OfflineDrill = require("../models/offlineDrillModel.js");
const OfflineAtheleteDrillsModel = require("../models/OfflineAtheleteDrills.js");
const {
  DynamicDrillColumns,
  DynamicDrill,
} = require("../models/DynamicDrillModel.js");
const TeleSessionsModel = require("../models/TeleSessionsModel");

const BookingServiceModel = require("../models/BookingService.js");
const { s3Uploadv2 } = require("../utils/aws.js");
const { format } = require("util");

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const email = req.query.email;
  const user = await userModel.findOne({ email: email, role: "doctor" });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  res.status(200).json({
    user,
  });
});

exports.getAthleteProfile = catchAsyncError(async (req, res, next) => {
  const email = req.query.email;
  const user = await userModel.findOne({ email: email, role: "athlete" });

  if (!user) {
    return next(new ErrorHandler("User not found.", 404));
  }

  res.status(200).json({
    user,
  });
});

exports.editClientProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req.query;
  const {
    firstName,
    lastName,
    prefix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
  } = req.body;
  if (!userId) return next(new ErrorHandler("Please send userId.", 404));
  const doctor = await userModel.findById(userId).select("-password");
  if (!doctor) {
    return next(new ErrorHandler("User Not Found.", 404));
  }
  if (doctor.role !== "athlete") {
    return next(new ErrorHandler("Not a athlete.", 404));
  }

  console.log("/^d+$/".test(zip));

  if (!"/^d+$/".test(zip)) {
    return next(new ErrorHandler("Zip code should be a number.", 404));
  }

  firstName && (doctor.firstName = firstName);
  lastName && (doctor.lastName = lastName);
  prefix && (doctor.prefix = prefix);
  gender && (doctor.gender = gender);
  dob && (doctor.dob = dob);
  address && (doctor.address = address);
  city && (doctor.city = city);
  zip && (doctor.zip = zip);
  state && (doctor.state = state);
  email && (doctor.email = email);
  phone && (doctor.phone = phone);
  await doctor.save();

  res.status(200).json({
    success: true,
    doctor,
  });
});

exports.editDoctorProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req.query;
  const {
    firstName,
    lastName,
    startTime,
    endTime,
    prefix,
    gender,
    dob,
    address,
    city,
    zip,
    state,
    email,
    phone,
  } = req.body;
  if (!userId) return next(new ErrorHandler("Please send userId.", 404));
  const doctor = await userModel.findById(userId).select("-password");
  if (!doctor) {
    return next(new ErrorHandler("User Not Found.", 404));
  }
  if (doctor.role !== "doctor") {
    return next(new ErrorHandler("Not a doctor.", 404));
  }

  firstName && (doctor.firstName = firstName);
  lastName && (doctor.lastName = lastName);
  startTime && (doctor.startTime = startTime);
  endTime && (doctor.lastName = endTime);
  prefix && (doctor.prefix = prefix);
  gender && (doctor.gender = gender);
  dob && (doctor.dob = dob);
  address && (doctor.address = address);
  city && (doctor.city = city);
  zip && (doctor.zip = zip);
  state && (doctor.state = state);
  email && (doctor.email = email);
  phone && (doctor.phone = phone);
  await doctor.save();

  res.status(200).json({
    success: true,
    doctor,
  });
});

exports.updateProfilePic = catchAsyncError(async (req, res, next) => {
  try {
    const { userId } = req; // Assuming you're using some authentication middleware
    const file = req.files;

    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // Fetch the current profile picture URL from the database (pseudo-code)
    const doctor = await userModel.findById(userId); // Replace with actual database call

    // Update the profile picture on S3 and get the new URL
    let result;
    result = await s3Uploadv2(file[0]);

    const newProfilePicUrl = result.Location;

    // Update the doctor's profile in the database with the new URL
    doctor.profilePic = newProfilePicUrl;
    await doctor.save();

    res.json({ success: true, profilePicUrl: newProfilePicUrl });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res
      .status(500)
      .json({ success: false, message: "Error updating profile picture" });
  }
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });

  if (!user || user.role !== "doctor")
    return next(new ErrorHandler("User Not Found.", 404));

  const code = generateCode(6);

  await userModel.findOneAndUpdate({ email }, { temp_code: code });
  resetPasswordCode(email, user.fullname, code);

  res.status(200).json({ message: "Code sent to your email." });
});

exports.validateForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  if (user.temp_code === code) {
    user.temp_code = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ message: "Code Validated Successfully." });
  } else {
    return next(new ErrorHandler("Invalid Code.", 400));
  }
});

exports.resetPassword = catchAsyncError(async (req, res, next) => {
  const { email, newPassword, confirmPassword } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));
  if (!newPassword || !confirmPassword)
    return next(new ErrorHandler("Please fill in all fields", 400));
  if (newPassword !== confirmPassword)
    return next(new ErrorHandler("Password does not match", 400));
  if (user.password === newPassword)
    return next(new ErrorHandler("Choose a new password"));
  user.password = newPassword;
  await user.save();

  res.status(203).json({ message: "Password Updated Successfully." });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel
    .findOne({ email: { $regex: new RegExp(email, "i") }, role: "doctor" })
    .select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  user.password = undefined;
  sendData(user, 200, res);
});

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.userId).select("+password");
  const { oldPassword, newPassword } = req.body;

  if (!user) return new ErrorHandler("User Not Found.", 404);

  if (!oldPassword || !newPassword)
    return next(new ErrorHandler("Please fill in all fields", 400));

  const isMatch = await user.comparePassword(oldPassword);

  if (!isMatch) {
    return next(new ErrorHandler("Old Password does not match", 400));
  }

  if (newPassword === oldPassword) {
    return next(
      new ErrorHandler("New Password cannot be same as old password", 400)
    );
  }
  user.password = newPassword;
  await user.save();
  res.status(203).json({ message: "Password Updated Successfully." });
});

exports.registerClient = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    prefix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !prefix ||
    !address ||
    !email ||
    !city ||
    !phone ||
    !state ||
    !dob ||
    !gender ||
    !zip
  ) {
    return next(new ErrorHandler("Please enter all the fields", 400));
  }

  let user = await userModel.findOne({ email });
  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  user = await userModel.create({
    firstName,
    lastName,
    prefix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
    password: `${phone}${firstName}`,
    role: "athlete",
  });
  newAccount(email, `${firstName}${lastName}`, `${phone}${firstName}`);
  await user.save();
  res.status(200).json({
    success: true,
    user,
    message: "Athlete added successfully",
  });
});

exports.checkClient = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Please provide a email", 400));
  }

  let user = await userModel.findOne({ email });
  if (!user || user.role === "admin" || user.role === "doctor")
    return next(
      new ErrorHandler("An athlete does not exist with this email", 400)
    );
  if (user.isActive === false) {
    return next(new ErrorHandler("Athlete is inactive with this email", 400));
  }

  res.status(200).json({
    success: true,
    client_details: {
      client_id: user._id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      phone: user.phone,
      plan_payment: user.plan_payment,
    },
  });
});

exports.bookAppointment = catchAsyncError(async (req, res, next) => {
  const client_id = req.params.id;

  let appointmentOnDate = 0;
  const {
    service_type,
    app_date,
    app_time,
    end_time,
    doctor_trainer,
    location,
    cost,
  } = req.body;

  console.log(
    service_type,
    app_date,
    app_time,
    end_time,
    doctor_trainer,
    location,
    cost
  );

  const [hours1, minutes1] = convertTo24HourFormat(app_time)
    .split(":")
    .map(Number);
  const totalMinutes = hours1 * 60 + minutes1;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // Combine the date and time
  const providedDateTime = dayjs(app_date).hour(hours).minute(minutes);

  // Get the current date and time
  const currentDateTime = dayjs();

  console.log("current time", currentDateTime);
  console.log("providesd time", providedDateTime, app_date, app_time, end_time);

  // Compare the provided date and time with the current date and time
  if (providedDateTime.isBefore(currentDateTime)) {
    return next(new ErrorHandler("Can't book appointment in past", 400));
  }

  const concussionAppointment = await appointmentModel.find({
    client: client_id,
    doctor_trainer,
    service_status: "upcoming",
  });

  if (concussionAppointment.length > 0) {
    return next(
      new ErrorHandler(
        "Cannot book consecutive appointments with the same doctor",
        400
      )
    );
  }
  // if (service_type === "TrainingSessions") {
  if (
    service_type === "TrainingSessions" ||
    service_type === "OfflineVisit" ||
    service_type === "TeleSession"
  ) {
    // For managing TrainingSessions

    let query = {
      service_type,
      app_date: `${app_date?.split("T")[0]}T00:00:00.000`,
      app_time,
      end_time,
      doctor_trainer,
      location,
      service_status: { $ne: "cancelled" },
    };
    const app_id = generateAppointmentId();
    if (!client_id) {
      return next(new ErrorHandler("Please provide a client_id", 400));
    }
    const client = await userModel.findById(client_id);
    if (!client) {
      return next(new ErrorHandler("Client does not exist", 400));
    }
    if (client.role !== "athlete") {
      return next(new ErrorHandler("Unauthorized! Access denied", 400));
    }
    // const result = await OfflineDrill.aggregate([
    //   { $match: { clientId: new mongoose.Types.ObjectId(client_id) } },
    //   { $unwind: "$sessions" },
    //   { $match: { "sessions.isBooked": false } },
    //   { $count: "nonBookedCount" },
    // ]);
    // const nonBookedCount = result.length > 0 ? result[0].nonBookedCount : 0;
    // if (!nonBookedCount) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Cannot find non-booked session",
    //   });
    // }

    const result = await OfflineAtheleteDrillsModel.findOne({
      client: new mongoose.Types.ObjectId(client_id),
    });
    const unBookedSessions = result.numOfSessions - result.sessions.length;

    if (unBookedSessions < 1 && service_type === "OfflineVisit") {
      return res.status(400).json({
        success: false,
        message: "Cannot find non-booked session",
      });
    }

    // const TeleSession = await appointmentModel.countDocuments({
    //   client: new mongoose.Types.ObjectId(client_id),
    //   service_type: "TeleSession",
    // });

    const TeleSession = await TeleSessionsModel.findOne({
      client: new mongoose.Types.ObjectId(client_id),
    });

    if (TeleSession?.count < 1 && service_type === "TeleSession") {
      return res.status(400).json({
        success: false,
        message: "Cannot find non-booked session",
      });
    }

    const dayAppointments = await appointmentModel
      .find(query)
      .sort({ createdAt: "desc" });
    if (dayAppointments.length > 0) {
      return next(
        new ErrorHandler("Already booked a appointment on this timeline", 400)
      );
    }
    const service = await ServiceTypeModel.findOne({ alias: service_type });
    const bservice = await BookingServiceModel.findOne({ alias: service_type });

    const appointment = await appointmentModel.create({
      appointment_id: app_id,
      client: client_id,
      service_type,
      app_date: `${app_date.split("T")[0]}T00:00:00.000`,
      app_time,
      end_time,
      doctor_trainer,
      location,
      amount: service?.cost || bservice?.cost || cost || 0,
      status:
        service_type === "Consultation" ||
        service_type === "ConsultationCall" ||
        service_type === "TrainingSessions" ||
        service_type === "OfflineVisit" ||
        service_type === "TeleSession"
          ? "paid"
          : "pending",
    });
    const date = new Date(app_date);
    date.setUTCHours(0, 0, 0, 0);
    await appointment.save();
    // const offlineDrillupdate = await OfflineDrill.findOneAndUpdate(
    //   {
    //     clientId: new mongoose.Types.ObjectId(client_id),
    //     "sessions.isBooked": false,
    //   },
    //   { $set: { "sessions.$.isBooked": true } },
    //   { new: true }
    // );

    console.log(service_type, appointment);

    const transaction = await transactionModel.create({
      doctor: doctor_trainer,
      service_type,
      date,
      payment_status:
        service_type === "Consultation" ||
        service_type === "ConsultationCall" ||
        service_type === "OfflineVisit" ||
        service_type === "TeleSession"
          ? "paid"
          : "pending",
      bookingId: appointment._id,
      clientId: client_id,
      amount: service?.cost || bservice?.cost || cost || 0,
    });
    await transaction.save();

    // await offlineDrillupdate.save();
    return res.status(200).json({
      success: true,
      message: `Appointment booked. Your Appointment ID: ${app_id}.`,
      appointment: appointment,
    });

    // यह ख़त्म है ट्रेनिंग सेशन
  }
  let query = {
    service_type,
    app_date: `${app_date.split("T")[0]}T00:00:00.000`,
    app_time,
    end_time,
    doctor_trainer,
    location,
    service_status: { $ne: "cancelled" },
  };
  const app_id = generateAppointmentId();
  if (!client_id) {
    return next(new ErrorHandler("Please provide a client_id", 400));
  }
  const client = await userModel.findById(client_id);
  if (!client) {
    return next(new ErrorHandler("Client does not exist", 400));
  }
  if (client.role !== "athlete") {
    return next(new ErrorHandler("Unauthorized! Access denied", 400));
  }
  const dayAppointments = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" });
  if (dayAppointments.length > 0) {
    return next(
      new ErrorHandler("Already booked a appointment on this timeline", 400)
    );
  }
  const service = await ServiceTypeModel.findOne({ alias: service_type });
  const appointment = await appointmentModel.create({
    appointment_id: app_id,
    client: client_id,
    service_type,
    app_date: `${app_date.split("T")[0]}T00:00:00.000`,
    app_time,
    end_time,
    doctor_trainer,
    location,
    amount: service.cost,
    status:
      service_type === "Consultation" ||
      service_type === "ConsultationCall" ||
      service_type === "TrainingSessions"
        ? "paid"
        : "pending",
  });
  const date = new Date(app_date);
  date.setUTCHours(0, 0, 0, 0);
  await appointment.save();
  const transaction = await transactionModel.create({
    doctor: doctor_trainer,
    service_type,
    date,
    payment_status:
      service_type === "Consultation" || service_type === "ConsultationCall"
        ? "paid"
        : "pending",
    bookingId: appointment._id,
    clientId: client_id,
    amount: service.cost,
  });
  await transaction.save();

  if (
    ![
      "Consultation" ||
        "ConsultationCall" ||
        "OfflineVisit" ||
        "TeleSession" ||
        "TrainingSessions",
    ].includes(service_type)
  ) {
    const notification = await createNotification(
      "Confirm Appointment",
      `Complete your payment to confirm your appointment for ${service_type}`,
      client._id,
      doctor_trainer
    );
    const mail = paymentMail(client.email, client.firstName, "appointment");
    await Promise.all([notification, mail]);
  }

  res.status(200).json({
    success: true,
    message: `Appointment booked. Your Appointment ID: ${app_id}.`,
    appointment: appointment,
  });
});

exports.recentBookings = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const status = req.query.status;
  const service_type = req.query.service_type;
  const date = req.query.date;
  const searchQuery = req.query.searchQuery;
  let query = {};

  if (status) {
    query.status = status;
  }
  if (service_type) {
    query.service_type = { $in: service_type.split(",") };
  }
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }
  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    const q = {};
    q.$or = [
      { firstName: regex },
      { lastName: regex },
      { first_name: regex },
      { last_name: regex },
      { email: regex },
    ];
    const users = await userModel.find(q);
    const ids = users.map((user) => user._id.toString());
    query.client = { $in: ids };
  }

  const appointments = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit);
  // .populate("client", "profilePic");

  console.log(appointments[0]);

  const totalRecords = await appointmentModel.countDocuments(query);
  res.json({
    appointments: appointments,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.recentPrescriptions = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const date = req.query.date;
  const service_type = req.query.service_type;
  const searchQuery = req.query.searchQuery;
  let appointments = [];
  const query = {
    service_type: {
      $in: [
        "MedicalOfficeVisit",
        "Consultation",
        "Medical/OfficeVisit",
        "ConsultationCall",
      ],
    },
  };
  if (service_type) {
    query.service_type = { $in: service_type.split(",") };
  }
  query.status = "paid";

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }

  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    const q = {};
    q.$or = [
      { firstName: regex },
      { lastName: regex },
      { first_name: regex },
      { last_name: regex },
      { email: regex },
    ];
    const users = await userModel.find(q);
    const ids = users.map((user) => user._id.toString());
    query.client = { $in: ids };
  }

  const appointmentsArray = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  await Promise.all(
    appointmentsArray.map(async (appoint) => {
      const Presform = await PrescriptionsForm.find({
        appointmentId: appoint._id,
      });
      let appointmentWithEval = {
        ...appoint.toObject(),
        isFilled: Boolean(Presform.length),
        presId: Boolean(Presform.length) ? Presform[0]._id : null,
      };
      appointments.push(appointmentWithEval);
    })
  );

  const result = appointments.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalRecords = await appointmentModel.countDocuments(query);

  res.json({
    appointments: result,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.inQueueRequests = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const service_type = req.query.service_type;
  const date = req.query.date;
  const searchQuery = req.query.searchQuery;
  const query = {};

  query.status = "paid";
  const allowedServices = [
    "ConcussionEval",
    "SportsVision",
    "Post-ConcussionEvaluation",
    "SportsVisionPerformanceEvaluation",
    "SportsVisionEvaluation",
    // "AddTrainingSessions",
    "GlassesExam",
    "ContactLensExam",
  ];

  if (service_type) {
    query.service_type = {
      $in: service_type.split(","),
    };
  } else {
    query.service_type = {
      $in: allowedServices,
    };
  }

  console.log("query", query);
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }
  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    const q = {};
    q.$or = [
      { firstName: regex },
      { lastName: regex },
      { first_name: regex },
      { last_name: regex },
      { email: regex },
    ];
    const users = await userModel.find(q);
    const ids = users.map((user) => user._id.toString());
    query.client = { $in: ids };
  }
  const appointmentsArray = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  let appointments = [];
  await Promise.all(
    appointmentsArray.map(async (appoint) => {
      const Evalform = await EvalutionsForm.find({
        appointmentId: appoint._id,
      });
      const Diagform = await DiagnosisForm.find({ appointmentId: appoint._id });
      if (!Boolean(Diagform.length)) {
        let appointmentWithEval = {
          ...appoint.toObject(),
          isFilledPrescription: Boolean(Evalform.length),
          isFilledDiagnosis: Boolean(Diagform.length),
        };
        appointments.push(appointmentWithEval);
      }
    })
  );

  const result = appointments.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  const totalRecords = await appointments.length;

  res.json({
    appointments: result,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.inQueueEvaluation = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const service_type = req.query.service_type;
  const searchQuery = req.query.searchQuery;
  const date = req.query.date;
  const query = {};
  console.log("query:", req.query);

  query.status = "paid";

  if (service_type) {
    query.service_type = { $in: [service_type] };
  } else {
    query.service_type = {
      $nin: [
        "MedicalOfficeVisit",
        "TrainingSession",
        "Medical/OfficeVisit",
        "TrainingSessions",
      ],
    };
  }
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }

  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    query.$or = [
      { "client.firstName": regex },
      { "client.lastName": regex },
      { "client.first_name": regex },
      { "client.last_name": regex },
      { "client.email": regex },
    ];
  }

  const appointments = await appointmentModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const totalRecords = await appointmentModel.countDocuments(query);

  res.json({
    appointments: appointments,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.selectPlan = catchAsyncError(async (req, res, next) => {
  const { plan, planPhase, mode, userId } = req.query;
  const requestUserId = req.userId; // ID from token

  console.log(userId, requestUserId);

  let userID = "";
  let doctorID = "";

  const user = await userModel.findById(requestUserId);

  if (userId) {
    if (user.role === "doctor") {
      userID = userId;
      doctorID = requestUserId;
    }
  }
  if (!userID) {
    userID = requestUserId;
  }

  console.log("USer iDDD:", userID);
  // Ensure all required fields are provided
  if (!plan || !planPhase) {
    return next(new ErrorHandler("Please provide a plan and phase.", 400));
  }

  // const currentPlan = user.plan;
  // const currentPhase = user.phase;
  // const isFirstPhase = planPhase === "Phase 1";

  // 1. If the user is new, they must start with Novice Basic
  // if (!currentPlan && plan !== "Novice") {
  //   return next(
  //     new ErrorHandler("New users must start with the Novice Basic plan.", 400)
  //   );
  // }

  // 2. If the user is on Novice Basic, they can only select Phase 1 of other plans
  // if (currentPlan === "Novice" && !isFirstPhase) {
  //   return next(
  //     new ErrorHandler(
  //       "You must start with Phase 1 when transitioning from Novice Basic.",
  //       400
  //     )
  //   );
  // }

  // 3. Ensure users can only progress sequentially within the same plan
  // if (currentPlan === plan && currentPhase !== planPhase) {
  //   const validProgression = await validateProgression(
  //     currentPlan,
  //     currentPhase,
  //     plan,
  //     planPhase
  //   );
  //   if (!validProgression) {
  //     return next(
  //       new ErrorHandler(
  //         "Invalid progression. Complete the current phase before progressing.",
  //         400
  //       )
  //     );
  //   }
  // }

  // Create or update DrillForm for the user if not already existing
  const DrillFormUser = await DrillForm.find({
    $or: [
      { clientId: userID },
      { clientId: new mongoose.Types.ObjectId(userID) },
    ],
  });

  console.log("Drill form user", DrillFormUser);

  let allActivitiesComplete = true;

  DrillFormUser.forEach((drill) => {
    console.log("drillss", drill);
    drill.drill.forEach((activity) => {
      activity.activities.forEach((comp) => {
        if (!comp.isComplete) {
          allActivitiesComplete = false; // If any activity is not complete
        }
      });
    });
  });

  if (!allActivitiesComplete) {
    return next(
      new ErrorHandler(
        "All activities must be completed before upgrading your plan",
        500
      )
    );
  }

  // If user has a Stripe subscription, cancel it
  if (user.stripeSubscriptionId) {
    try {
      const canceledSubscription = await stripe.subscriptions.cancel(
        user.stripeSubscriptionId
      );
      console.log(
        `Canceled Stripe subscription for user ${userID}:`,
        canceledSubscription
      );
    } catch (error) {
      console.error("Error canceling Stripe subscription:", error);
      return next(
        new ErrorHandler("Failed to cancel existing Stripe subscription", 500)
      );
    }
  }

  if (DrillFormUser.length === 0) {
    const form = await DrillFormModel.find({
      plan: { $regex: new RegExp(plan, "i") },
      phase: { $regex: new RegExp(planPhase, "i") },
    }).select("-_id -__v");

    if (form.length !== 0) {
      const drillForm = await DrillForm.create({
        clientId: userID,
        drill: form,
      });
      drillForm.save();
    }
  }

  // Update appointment with plan and phase
  const appointment = await appointmentModel.updateMany(
    { "client._id": new mongoose.Types.ObjectId(userID) },
    {
      $set: {
        "client.plan": plan,
        "client.phase": planPhase,
        "client.plan_payment": "pending",
      },
    }
  );

  // Get the plan's cost and update the transaction
  const selectedPlan = await planModel.findOne({ name: plan });
  const selectedPhase = selectedPlan.phases.find(
    (phase) => phase.name === planPhase
  );
  const transactionDate = new Date().setUTCHours(0, 0, 0, 0);

  const transaction = await transactionModel.create({
    plan,
    phase: planPhase,
    date: transactionDate,
    payment_status: "pending",
    service_type: "planPurchase",
    clientId: userID,
    amount: selectedPhase.cost,
    mode,
  });

  transaction.save();

  console.log("created transactions: ", transaction);

  // Update user with the new plan, phase, and payment status
  user.plan = plan;
  user.phase = planPhase;
  user.plan_payment = "pending";
  user.mode = mode;
  await user.save();

  // Notify user
  const title =
    user?.role === "athlete"
      ? "Plan selected successfully!"
      : "Doctor has selected your plan";
  const message = `${
    user?.role == "athlete" ? "You have" : "Doctor has"
  } selected plan ${plan} and phase ${planPhase}`;

  let doctor = "";
  if (user.role !== "athlete") {
    const lastAppointment = await appointmentModel
      .find({ client: userID })
      .sort({ createdAt: -1 });

    if (lastAppointment && lastAppointment.length > 0) {
      doctor = lastAppointment[0].doctor_trainer;
    }
  }

  const notification = createNotification(title, message, userID, doctor);

  const mail = paymentMail(user.email, user.firstName, "Plan Selection");
  const success = await Promise.all([notification, mail]);

  if (success) {
    res.status(200).json({
      success: true,
      message: `Plan updated. Current plan: ${user.plan}. Notified the user.`,
      user,
      appointment,
    });
  }
});
const validateProgression = async (
  currentPlan,
  currentPhase,
  newPlan,
  newPhase
) => {
  if (!currentPlan || !currentPhase) {
    // If no current plan or phase, allow starting a new plan
    return newPhase === "Phase I";
  }

  // Define progression rules
  const validProgressions = {
    Novice: ["Intermediate Phase I", "Advanced Phase I"], // Novice can only progress to Phase I of Intermediate or Advanced
    Intermediate: ["Advanced Phase I", "Elite Phase I"],
    Advanced: ["Elite Phase I"],
    Elite: [],
  };

  // If user is in Novice Basic phase, they can progress to Intermediate or Advanced Phase I
  if (currentPlan === "Novice" && currentPhase === "Basic") {
    return ["Intermediate Phase I", "Advanced Phase I"].includes(
      `${newPlan} ${newPhase}`
    );
  }

  // Only allow moving from Phase I to Phase II within the same plan
  const nextPhaseAllowed =
    currentPhase === "Phase I" && newPhase === "Phase II";

  // Allow moving to higher-level programs only from Phase I of the next level
  if (
    validProgressions[currentPlan]?.includes(`${newPlan} ${newPhase}`) &&
    newPhase === "Phase I"
  ) {
    return true;
  }

  return nextPhaseAllowed;
};

const normalize = (str) => str.replace(/\s+/g, "").toLowerCase();
exports.getForm = catchAsyncError(async (req, res) => {
  // // const schemaContent = fs.readFileSync(path.resolve(baseSchemaPathEval), 'utf8');
  // try {
  //     const evaluationModel = require('../models/evaluationModel');
  //     // const dynamicSchema = eval(schemaContent);
  //     const dynamicSchema = evaluationModel;
  //     const paths = Object.keys(dynamicSchema.schema.paths);

  //     const fieldsAndEnums = paths.reduce((result, path) => {
  //         const schemaType = dynamicSchema.schema.paths[path];
  //         if (schemaType.enumValues) {
  //             result.push({ field: path, enumValues: schemaType.enumValues });
  //         }
  //         return result;
  //     }, []);
  //     res.json(fieldsAndEnums);
  // } catch (error) {
  //     console.error(error);
  //     res.status(500).send('Internal Server Error');
  // }
  const name = req.query.name;
  const serviceName = req.query.serviceType;

  if (!name || typeof name !== "string") {
    return res.status(400).json({ success: false, message: "Invalid input" });
  }
  // const doc = await EvalForm.findOne({ name });
  const result = await EvalForm.findOne({ name }).populate(
    "serviceType.service",
    "name"
  );

  const doc = result?.serviceType.find((s) => {
    return normalize(s.service.name) === normalize(serviceName);
  });

  if (!doc || doc.length < 1) {
    return res.status(400).json({ success: false, message: "Not found" });
  }
  res.status(200).json({ success: true, doc });
});

exports.getAppointment = catchAsyncError(async (req, res) => {
  const date = req.params.date;
  if (!date) {
    return res.status(400).json({ error: "Date parameter is required." });
  }
  const startDate = new Date(date);
  const endDate = new Date(date);
  endDate.setDate(endDate.getDate() + 1);
  const appointments = await appointmentModel.find({
    app_date: date,
    app_date: {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    },
  });
  res.status(200).json({
    success: true,
    appointments: appointments,
  });
});

exports.getSlots = catchAsyncError(async (req, res) => {
  const { doctor, date, service_type, location } = req.query;
  let slots = [];
  const query = {};
  if (date) {
    query.date = date + "T00:00:00.000+00:00";
    // query.date = date + "+00:00";
  }
  if (doctor) {
    query.doctor = doctor;
  }
  if (date && doctor && service_type) {
    let fdate = `${date.split("T")[0]}T00:00:00.000Z`;
    const dayAppointments = await appointmentModel.find({
      doctor_trainer: doctor,
      app_date: fdate,
    });
    console.log(dayAppointments, date, fdate);
    const doc = await slotModel.find(query);
    let Calcslots = [];
    if (dayAppointments.length > 2) {
      console.log("Data", data);
      const promises = dayAppointments.map((app, index) => {
        if (index === 0) {
          calculateTimeDifference(
            doc[0].startTime,
            null,
            app.app_time,
            app.service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
          });
        } else if (index + 1 === dayAppointments.length) {
          calculateTimeDifference(
            app.app_time,
            app.service_type,
            doc[0].startTime,
            service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
            Calcslots = Calcslots.filter((slot) => slot !== undefined);
            slots = Calcslots.map((slot, index) => [
              slot,
              Calcslots[index + 1] == null
                ? doc[0].endTime
                : Calcslots[index + 1],
            ]);
            return res.status(200).json({ slots: slots });
          });
        } else {
          calculateTimeDifference(
            app.app_time,
            app.service_type,
            dayAppointments[index + 1].app_time,
            service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
          });
        }
      });
      Calcslots = await Promise.all(promises);
    }
    if (dayAppointments.length === 2) {
      console.log("Data2", data);
      const promises = dayAppointments.map((app, index) => {
        if (index === 0) {
          calculateTimeDifference(
            doc[0].startTime,
            null,
            app.app_time,
            app.service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
          });
        } else if (index + 1 === dayAppointments.length) {
          calculateTimeDifference(
            dayAppointments[index - 1].end_time,
            null,
            app.app_time,
            service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
          });

          calculateTimeDifference(
            app.end_time,
            null,
            doc[0].endTime,
            service_type
          ).then((data) => {
            if (data.length > 0) {
              data.map((slot) => Calcslots.push(slot));
            }
            Calcslots = Calcslots.filter((slot) => slot !== undefined);
            slots = Calcslots.map((slot, index) => [
              slot,
              Calcslots[index + 1] == null
                ? doc[0].endTime
                : Calcslots[index + 1],
            ]);
            return res.status(200).json({ slots: slots });
          });
        }
      });
      Calcslots = await Promise.all(promises);
    }
    if (dayAppointments.length === 1) {
      console.log("Data3", data);

      const promises = dayAppointments.map((app, index) => {
        calculateTimeDifference(
          doc[0].startTime,
          null,
          app.app_time,
          app.service_type
        ).then((data) => {
          data.map((slot) => Calcslots.push(slot));
        });
        calculateTimeDifference(
          app.app_time,
          app.service_type,
          doc[0].endTime,
          service_type
        ).then((data) => {
          data.map((slot) => Calcslots.push(slot));
          slots = Calcslots.map((slot, index) => [
            slot,
            Calcslots[index + 1] == null
              ? doc[0].endTime
              : Calcslots[index + 1],
          ]);
          return res.status(200).json({ slots: slots });
        });
      });
      await Promise.all(promises);
    }
    if (dayAppointments.length === 0) {
      calculateTimeDifference(
        doc[0].startTime,
        null,
        doc[0].endTime,
        service_type
      ).then(async (data) => {
        console.log("Data4", data);

        data.map((slot) => Calcslots.push(slot));

        slots = await Promise.all(
          Calcslots.map(async (slot, index) => {
            let endTime = Calcslots[index + 1];
            if (Calcslots[index + 1] == null) {
              endTime = await timeDiff(
                service_type,
                Calcslots[index],
                doc[0].endTime
              );
            }
            const endInt = formatTime(endTime);
            return [slot, endInt];
          })
        );

        return res.status(200).json({ slots: slots });
      });
    }
    return;
  }
  if (!doctor && !date) {
    slots = await slotModel.find().select("date address");
    return res.status(200).json({ dates: slots });
  } else {
    let dates = await slotModel.find().select("date address");
    slots = await slotModel.find(query);
    return res.status(200).json({
      location: slots,
      dates: dates,
    });
  }
});

exports.getAllDoc = catchAsyncError(async (req, res) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const query = {};
  query.role = "doctor";
  const doctors = await userModel
    .find(query)
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  const totalRecords = await userModel.countDocuments(query);
  res.json({
    doctors: doctors,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
  });
});

exports.getAllServices = catchAsyncError(async (req, res, next) => {
  const serviceType = await ServiceTypeModel.find();
  const bookingType = await BookingServiceModel.find();

  let services = {};

  serviceType.forEach((service) => (services[service.alias] = service.name));

  bookingType.forEach((booking) => (services[booking.alias] = booking.name));
  res.status(200).json({
    success: true,
    services,
  });
});

exports.getServiceTypes = catchAsyncError(async (req, res, next) => {
  const serviceType = await ServiceTypeModel.find();
  const services = sortServices(serviceType);

  res.status(200).json({
    success: true,
    serviceType: services,
  });
});

exports.getPlans = catchAsyncError(async (req, res, next) => {
  const plans = await planModel.find();
  res.status(200).json({
    success: true,
    plans,
  });
});

exports.submitEvaluation = catchAsyncError(async (req, res, next) => {
  const { appointmentId, form } = req.body;

  if (!appointmentId || !form) {
    return next(new ErrorHandler("Fields are empty", 404));
  }

  const forms = await EvalutionsForm.find({ appointmentId });

  if (forms.length > 0) {
    return next(new ErrorHandler("Form is already  filled for this", 404));
  }

  const newEvalForm = new EvalutionsForm({
    appointmentId,
    form,
  });

  await newEvalForm.save();

  res.status(200).json({
    success: true,
    message: "Form Submitted",
    newEvalForm,
  });
});

exports.submitPrescription = catchAsyncError(async (req, res, next) => {
  const { appointmentId, form } = req.body;

  if (!appointmentId || !form) {
    return next(new ErrorHandler("Fields are empty", 404));
  }

  const forms = await PrescriptionsForm.find({ appointmentId });

  if (forms.length > 0) {
    return next(new ErrorHandler("Form is already  filled for this", 404));
  }

  const newEvalForm = new PrescriptionsForm({
    appointmentId,
    form,
  });

  await newEvalForm.save();

  const appointment = await appointmentModel.findById(appointmentId);
  appointment.service_status = "completed";
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Form Submitted",
    newEvalForm,
  });
});

exports.submitDiagnosis = catchAsyncError(async (req, res, next) => {
  const { appointmentId, form } = req.body;

  if (!appointmentId || !form) {
    return next(new ErrorHandler("Fields are empty", 404));
  }

  const forms = await DiagnosisForm.find({ appointmentId });
  const appointment = await appointmentModel.findById(appointmentId);

  if (forms.length > 0) {
    return next(new ErrorHandler("Form is already  filled for this", 404));
  }

  const newEvalForm = new DiagnosisForm({
    appointmentId,
    form,
  });

  await newEvalForm.save();
  appointment.service_status = "completed";
  await appointment.save();

  res.status(200).json({
    success: true,
    message: "Form Submitted",
    newEvalForm,
  });
});

exports.getAllAppointments = catchAsyncError(async (req, res) => {
  const searchQuery = req.query.searchQuery;
  const appointmentsByDate = await appointmentModel
    .aggregate([
      {
        $addFields: {
          appDate: {
            $toDate: "$app_date",
          },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: "$appDate" },
            month: { $month: "$appDate" },
            day: { $dayOfMonth: "$appDate" },
          },
          appointments: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 },
      },
    ])
    .sort({ createdAt: "desc" });
  const currentDate = moment().startOf("day");
  const filteredAppointments = appointmentsByDate.filter((dateGroup) => {
    if (currentDate.year() <= dateGroup._id.year) {
      if (currentDate.month() + 1 <= dateGroup._id.month) {
        if (currentDate.date() <= dateGroup._id.day) {
          return true;
        }
      }
    }
    return false;
  });
  const formattedAppointments = filteredAppointments.map((dateGroup) => ({
    date: moment({ ...dateGroup._id, month: dateGroup._id.month - 1 }).format(
      "MM-DD-YYYY"
    ),
    appointments: dateGroup.appointments,
  }));
  const groupedAppointments = {};
  formattedAppointments.forEach((appointment) => {
    const date = appointment.date;
    if (!groupedAppointments[date]) {
      groupedAppointments[date] = [];
    }
    groupedAppointments[date].push(appointment);
  });
  const sortedDates = Object.keys(groupedAppointments).sort();
  const sortedAppointments = sortedDates.flatMap(
    (date) => groupedAppointments[date]
  );
  for (let index = 0; index < sortedAppointments.length; index++) {
    let appointmentsPopulated = [];
    for (const element of sortedAppointments[index].appointments) {
      const client = await userModel.findById(
        new mongoose.Types.ObjectId(element.client)
      );
      let appointment = {
        ...element,
      };
      appointment.client = client;
      appointmentsPopulated.push(appointment);
    }
    sortedAppointments[index].appointments = appointmentsPopulated;
  }
  res.status(200).json({
    success: true,
    appointments: sortedAppointments,
  });
});

exports.appointmentStatus = catchAsyncError(async (req, res, next) => {
  const { Id, status } = req.query;

  if (!Id || !status) {
    return next(new ErrorHandler("Fields are empty", 404));
  }
  const appointment = await appointmentModel.findById(Id);
  if (!appointment) {
    return next(new ErrorHandler("No such appointment exists", 404));
  }
  appointment.service_status = status;
  await appointment.save();

  res.status(200).json({
    success: true,
    appointment,
  });
});

exports.getPrescription = catchAsyncError(async (req, res, next) => {
  const prescriptionId = req.query.prescriptionId;
  const appointmentId = req.query.appointmentId;

  if (!prescriptionId) {
    return next(new ErrorHandler(" prescriptionId not received ", 404));
  }

  if (appointmentId) {
    const form = await PrescriptionsForm.findOne({
      appointmentId: new mongoose.Types.ObjectId(appointmentId),
    });
    return res.status(200).json({
      success: true,
      form,
    });
  }
  const form = await PrescriptionsForm.findById(prescriptionId);

  res.status(200).json({
    success: true,
    form,
  });
});

exports.getEvaluation = catchAsyncError(async (req, res, next) => {
  const evaluationId = req.query.evaluationId;

  if (!evaluationId) {
    return next(new ErrorHandler(" evaluationId not received ", 404));
  }
  const form = await EvalutionsForm.findById(evaluationId);
  const diagForm = await DiagnosisForm.findOne({
    appointmentId: form.appointmentId,
  });
  res.status(200).json({
    success: true,
    evaluationForm: form,
    diagnosisForm: diagForm,
  });
});

exports.completedReq = catchAsyncError(async (req, res) => {
  const { service_type, payment_status, date } = req.query;

  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const searchQuery = req.query.searchQuery;
  const query = {};
  query.service_type = {
    $in: [
      "ConcussionEval",
      "SportsVisionEvaluation",
      "Post-ConcussionEvaluation",
      "SportsVisionPerformanceEvaluation",
      // "TrainingSessions",
      "GlassesExam",
      "ContactLensExam",
    ],
  };
  query.status = "paid";
  if (service_type) {
    query.service_type = service_type.split(",");
  }
  if (payment_status) {
    query.payment_status = payment_status;
  }
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.app_date = {
      $gte: startDate.toISOString().split("T")[0],
      $lt: endDate.toISOString().split("T")[0],
    };
  }
  let appointments = [];
  if (searchQuery) {
    const regex = new RegExp(`^${searchQuery}`, "i");
    query.$or = [
      { "client.firstName": regex },
      { "client.lastName": regex },
      { "client.first_name": regex },
      { "client.last_name": regex },
      { "client.email": regex },
    ];
  }

  console.log("query", query, service_type);
  const appointmentsArray = await appointmentModel
    .find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .exec();

  await Promise.all(
    appointmentsArray.map(async (appoint) => {
      const Evalform = await EvalutionsForm.find({
        appointmentId: appoint._id,
      });
      const Diagform = await DiagnosisForm.find({ appointmentId: appoint._id });

      if (Evalform.length && Diagform.length) {
        let appointmentWithEval = {
          ...appoint.toObject(),
          evaluationId: Evalform[0]._id,
        };

        appointments.push(appointmentWithEval);
      }
    })
  );

  const result = appointments.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalRecords = await appointmentModel.countDocuments(query);

  res.status(200).json({
    success: true,
    appointments: result,
    totalPages: Math.ceil(totalRecords / limit),
  });
});

exports.getDrillDetails = catchAsyncError(async (req, res, next) => {
  const { clientId, week } = req.query;
  //  complete percentage

  if (!clientId) {
    return next(new ErrorHandler("Client ID is required", 400));
  }

  const drill = await DrillForm.find({
    $or: [{ clientId }, { clientId, "drill.week": week }],
  });
  const client = await userModel.findById(clientId);

  const form = await DrillFormModel.find({
    plan: { $regex: new RegExp(client.plan, "i") },
    phase: { $regex: new RegExp(client.phase, "i") },
  }).select("-_id -__v");

  if (form.length < 1)
    return next(new ErrorHandler("The required form does not exists", 404));

  const formFull = await DrillFormModel.aggregate([
    {
      $match: {
        plan: { $regex: new RegExp(client.plan, "i") },
        phase: { $regex: new RegExp(client.phase, "i") },
        week: { $regex: new RegExp(week, "i") },
      },
    },
    {
      $group: {
        _id: { week: "$week" },
        week: { $first: "$week" },
        act: { $push: "$$ROOT.activities.isComplete" },
        drills: { $push: "$$ROOT" },
      },
    },
    {
      $group: {
        _id: null,
        totalWeeks: { $sum: 1 },
        weeks: { $push: "$$ROOT" },
      },
    },
  ]);
  const WeekCount = await DrillFormModel.aggregate([
    {
      $match: {
        plan: { $regex: new RegExp(client.plan, "i") },
        phase: { $regex: new RegExp(client.phase, "i") },
      },
    },
    {
      $group: {
        _id: { week: "$week" },
        week: { $first: "$week" },
        drills: { $push: "$$ROOT" },
      },
    },
    {
      $group: {
        _id: null,
        totalWeeks: { $sum: 1 },
        weeks: { $push: "$$ROOT" },
      },
    },
  ]);

  if (drill.length < 1) {
    const drillForm = await DrillForm.create({
      clientId: clientId,
      drill: form,
    });
    drillForm.save();
    res.status(200).json({
      success: true,
      totalWeeks: WeekCount[0].totalWeeks,
      completePercentage: 0,
      weeks: formFull[0].weeks,
    });
  } else {
    const aggregationPipeline = [
      {
        $match: {
          $or: [
            {
              clientId: new mongoose.Types.ObjectId(clientId),
            },
            {
              clientId: new mongoose.Types.ObjectId(clientId),
            },
          ],
        },
      },
      {
        $unwind: "$drill",
      },
      {
        $match: week ? { "drill.week": week.toString() } : {},
      },
      {
        $group: {
          _id: "$drill.week",
          drills: { $push: "$drill" },
          totalActivities: { $push: "$drill.activities.isComplete" },
          totalActivities: {
            $push: {
              $cond: {
                if: "$drill.activities.isComplete",
                then: "$drill.activities.isComplete",
                else: false,
              },
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          totalWeeks: { $sum: 1 },
          totalActivities: { $push: "$totalActivities" },
          weeks: { $push: { week: "$_id", drills: "$drills" } },
        },
      },
    ];
    const drill = await DrillForm.aggregate(aggregationPipeline);
    if (drill.length === 0) {
      return next(new ErrorHandler("Drill cannot be found or created", 400));
    }
    const runner = (drill) => {
      const [data] = drill[0].totalActivities;
      let totalActivitiesdone = 0;
      let totalActivities = 0;
      data.forEach((data) => {
        data.forEach((list) => {
          ++totalActivities;
          list && ++totalActivitiesdone;
        });
      });
      return (percentage = (totalActivitiesdone / totalActivities) * 100);
    };
    res.status(200).json({
      success: true,
      completePercentage: runner(drill),
      weeks: drill[0].weeks,
      totalWeeks: WeekCount[0].totalWeeks,
    });
  }
});

exports.drillUpdate = catchAsyncError(async (req, res, next) => {
  const { id: targetId, user } = req.query;
  let userId = user;
  if (!user) {
    userId = jwt.verify(
      req.headers.authorization.split(" ")[1],
      process.env.JWT_SECRET
    ).userId;
  }
  const form = req.body.form;
  try {
    if (form) {
      const result = await DrillForm.updateOne(
        {
          "drill.activities._id": new mongoose.Types.ObjectId(targetId),
          clientId: new mongoose.Types.ObjectId(userId),
        },
        {
          $set: {
            "drill.$[].activities.$[elem].form": form,
            "drill.$[].activities.$[elem].isComplete": true,
          },
        },
        {
          arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(targetId) }],
        }
      );

      const r = await DrillForm.findOne({
        clientId: new mongoose.Types.ObjectId(userId),
      });

      let week = 0;
      let day = 0;

      const currentDayIndex = r.drill.findIndex((item) => {
        const s = item.activities.find((i) => {
          console.log(i);
          return String(i._id) === String(targetId);
        });
        if (s) {
          week = item.week;
          day = item.day;
          console.log("s", s);
        }

        return s ? true : false;
      });

      let nextDayNotify = false;
      if (currentDayIndex >= 0 && currentDayIndex < r.drill.length - 1) {
        nextDayNotify = true;
      }
      await createNotification(
        "Session Completed",
        `You have successfully completed the week ${week} Day ${day} drill`,
        userId
      );

      if (nextDayNotify) {
        await createNotification(
          "Incomplete Drill",
          `Your week ${r.drill[currentDayIndex + 1].week} day ${
            r.drill[currentDayIndex + 1].day
          } drill is not complete, Click here to complete`,
          userId
        );
      }

      if (result.matchedCount > 0) {
        res
          .status(200)
          .json({ success: true, message: "Form updated successfully" });
      } else {
        res.status(404).json({ success: false, message: "Form not found" });
      }
    } else {
      const result = await DrillForm.updateOne(
        {
          "drill.activities._id": new mongoose.Types.ObjectId(targetId),
          clientId: new mongoose.Types.ObjectId(userId),
        },
        { $set: { "drill.$[].activities.$[elem].isComplete": true } },
        {
          arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(targetId) }],
        }
      );
      if (result.matchedCount > 0) {
        res
          .status(200)
          .json({ success: true, message: "Activity updated successfully" });
      } else {
        res.status(404).json({ success: false, message: "Activity not found" });
      }
    }
  } catch (error) {
    console.error("Error updating activity:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

exports.getTrainigSessionModel = catchAsyncError(async (req, res, next) => {
  const { session_type, frequencyType } = req.query;
  if (session_type) {
    const trainigSessionModel = await TrainingSessionModel.find({
      session_type,
      frequency: frequencyType,
    });
    return res.status(200).json({
      success: true,
      message: "Fetched trainig session models",
      trainigSessionModel,
    });
  }
  const trainigSessionModel = await TrainingSessionModel.find();
  return res.status(200).json({
    success: true,
    message: "Fetched trainig session models",
    trainigSessionModel,
  });
});

exports.createTrainigSessionModel = catchAsyncError(async (req, res, next) => {
  const { session_type, cost, sessions, frequency } = req.body;

  const Tsession = await TrainingSessionModel.findOne({
    session_type,
    cost,
    sessions,
    frequency,
  });
  if (Tsession) return next(new ErrorHandler("This is already created", 400));
  try {
    const newSession = await TrainingSessionModel.create({
      session_type,
      cost,
      sessions,
      frequency,
    });
    await newSession.save();
    return res.status(200).json({
      success: true,
      message: "Training session Added successfully",
    });
  } catch (error) {
    return next(new ErrorHandler("Internal server error" + error, 400));
  }
});

exports.updateTrainingSessionModel = catchAsyncError(async (req, res, next) => {
  const { session_type, cost, sessions, frequency } = req.body;
  const { id } = req.query;
  try {
    const session = await TrainingSessionModel.findByIdAndUpdate(
      id,
      { session_type, cost, sessions, frequency },
      { new: true, runValidators: true }
    );

    if (!session) {
      return next(new ErrorHandler("Training session not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Successfully updated",
      data: session,
    });
  } catch (error) {
    return next(
      new ErrorHandler("Internal server error: " + error.message, 500)
    );
  }
});

exports.deleteTrainingSessionModel = catchAsyncError(async (req, res, next) => {
  const { id } = req.query;

  if (!id) {
    return next(
      new ErrorHandler("Training session not found or id not sent", 404)
    );
  }

  try {
    const result = await TrainingSessionModel.findByIdAndDelete(id);

    if (!result) {
      return next(new ErrorHandler("Training session not found", 404));
    }

    return res.status(200).json({
      success: true,
      message: "Training session is deleted successfully",
    });
  } catch (error) {
    return next(
      new ErrorHandler("Internal server error: " + error.message, 500)
    );
  }
});

exports.addTrainingSession = catchAsyncError(async (req, res, next) => {
  console.log("dsssssssssss");
  const { clientId, sessionId, mode, appointmentId } = req.query;

  const { doctor_trainer, service_type } = req.body;

  if (!clientId || !sessionId) {
    c;
    return res.status(400).json({
      success: false,
      message: "Client ID and Session ID are required",
    });
  }

  const [client, TrainingSession] = await Promise.all([
    userModel.findById(clientId),
    TrainingSessionModel.findById(sessionId),
  ]);

  if (!TrainingSession) {
    return res.status(404).json({
      success: false,
      message: "Training session not found",
    });
  }

  const rmyes = await OfflineAtheleteDrillsModel.findOne({
    client: new mongoose.Types.ObjectId(clientId),
    // appointment: new mongoose.Types.ObjectId(appointmentId),
    // numOfSessions: TrainingSession.sessions,
  });

  if (rmyes) {
    rmyes.unPaidSessions = TrainingSession.sessions;
    await rmyes.save();
  }

  const dater = new Date();
  const fdate = dater.setUTCHours(0, 0, 0, 0);
  const transaction = await transactionModel.create({
    payment_status: "pending",
    doctor: doctor_trainer,

    plan: sessionId,
    service_type,
    date: fdate,
    clientId,
    amount: TrainingSession.cost,
    mode: mode,
  });
  transaction.save();

  const title = "Additional sessions";
  const message = `Doctor has added ${TrainingSession.sessions} training Sessions. `;

  const authUserId = req.userId;
  const checkUser = await userModel.findById(authUserId);
  const isSend = await createNotification(
    title,
    message,
    clientId,
    checkUser?.firstName
  );

  return res.status(200).json({
    success: true,
  });
});

exports.buyTrainingSession = catchAsyncError(async (req, res, next) => {
  const { clientId, sessionId, mode, appointmentId } = req.query;

  const { doctor_trainer, service_type, frequencyType } = req.body;
  console.log("Frequency Type", frequencyType);
  console.log("sdsd", doctor_trainer, service_type);
  const authUserId = req.userId;

  if (!clientId || !sessionId) {
    return res.status(400).json({
      success: false,
      message: "Client ID and Session ID are required",
    });
  }

  const [client, TrainingSession] = await Promise.all([
    userModel.findById(clientId),
    TrainingSessionModel.findById(sessionId),
  ]);
  console.log("damnnnnnn", client);

  if (!TrainingSession) {
    return res.status(404).json({
      success: false,
      message: "Training session not found",
    });
  }

  const sessions = Array.from({ length: TrainingSession.sessions }, () => ({}));

  const SessionForUser = await OfflineDrill.create({
    clientId,
    sessions,
  });
  SessionForUser.save();

  let expirationDate = null;
  const today = new Date();
  const sixMonthsFromToday = new Date(today.setMonth(today.getMonth() + 6));

  // const sixMonthsFromToday = new Date(today.getTime() + 5 * 60 * 1000);
  expirationDate = sixMonthsFromToday;

  const rmyes = await OfflineAtheleteDrillsModel.create({
    client: new mongoose.Types.ObjectId(clientId),
    appointment: new mongoose.Types.ObjectId(appointmentId),
    numOfSessions: TrainingSession.sessions,
    serviceType: frequencyType,
    expirationDate,
  });

  console.log("res", rmyes);

  const dater = new Date();
  const fdate = dater.setUTCHours(0, 0, 0, 0);
  const transaction = await transactionModel.create({
    payment_status: "pending",
    doctor: doctor_trainer,
    bookingId: appointmentId,
    plan: sessionId,
    service_type,
    date: fdate,
    clientId,
    amount: TrainingSession.cost,
    mode: mode,
  });
  transaction.save();

  client.plan = "offline";
  client.mode = "offline";
  client.is_online = "false";
  client.plan_payment = "pending";
  await client.save();

  const checkUser = await userModel.findById(authUserId);
  const title =
    checkUser.role === "athlete"
      ? "Training Sessions Selected Successfully!"
      : "Doctor Has Selected Training Sessions";

  const message =
    checkUser.role === "athlete"
      ? "You have selected training sessions."
      : "Training sessions have been selected by the doctor for you.";

  let doctor = "";
  if (checkUser.role !== "athlete") {
    const lastAppointment = await appointmentModel
      .find({ client: clientId })
      .sort({ createdAt: -1 });

    if (lastAppointment && lastAppointment.length > 0) {
      doctor = lastAppointment[0].doctor_trainer;
    }
  }

  console.log("doctor", doctor);

  const isSend = await createNotification(title, message, clientId, doctor);

  await paymentMail(client.email, client.firstName, "Training Sessions");

  return res.status(200).json({
    success: true,
    SessionForUser,
  });
});

exports.updateDrill = catchAsyncError(async (req, res, next) => {
  const { clientId, drillId, drillLabel } = req.query;
  const { form } = req.body;
  if (!clientId || !drillId || !form || !drillLabel)
    return next(new ErrorHandler("Empty Fields", 400));

  const result = await OfflineDrill.updateOne(
    {
      "sessions.drills._id": new mongoose.Types.ObjectId(drillId),
      clientId: new mongoose.Types.ObjectId(clientId),
    },
    {
      $set: {
        "sessions.$[].drills.$[elem].form": form,
        "sessions.$[].drills.$[elem].label": drillLabel,
        "sessions.$[].drills.$[elem].isComplete": true,
      },
    },
    { arrayFilters: [{ "elem._id": new mongoose.Types.ObjectId(drillId) }] }
  );

  if (result.nModified === 0) {
    return next(new ErrorHandler("Update Failed", 400));
  }
  res.status(200).json({ success: true, data: result });
});

exports.offlineDrillForm = catchAsyncError(async (req, res, next) => {
  const { clientId, sessionIndex, drillTitle, form } = req.body;
  //    console.log(form);
  //    console.log(clientId,sessionNo,drillTitle);
  const sessionNumber = +sessionIndex;

  const newDrill = {
    label: drillTitle,
    isComplete: false,
    form: form,
  };

  await OfflineDrill.updateOne(
    { clientId: clientId },
    { $push: { [`sessions.${sessionNumber}.drills`]: newDrill } }
  );

  res.json({ message: "Drill added succesfully!" });
});

exports.getOfflineDrills = catchAsyncError(async (req, res, next) => {
  const { clientId } = req.query;

  if (!clientId) {
    throw new Error("No such athelete exists");
  }
  const offlineDrill = await OfflineDrill.findOne({ clientId });
  res.json(offlineDrill);
});

exports.submitOfflineDrills = catchAsyncError(async (req, res, next) => {
  const clientId = req.body.clientId;
  const sessionId = req.body.sessionId;
  const drillId = req.body.drillId;
  const formValues = req.body.formValues;

  console.log("Client ID:", clientId);
  console.log("Session ID:", sessionId);
  console.log("Drill ID:", drillId);
  console.log("Form Values:", formValues);

  // Check if formValues is an array and has elements
  if (!Array.isArray(formValues) || formValues.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Form values are required" });
  }

  const updatePromises = formValues.map((field) => {
    console.log("Updating field ID:", field._id, "with value:", field.value);

    return OfflineDrill.updateOne(
      {
        clientId: clientId,
        "sessions._id": sessionId,
        "sessions.drills._id": drillId,
        "sessions.drills.form._id": field._id,
      },
      {
        $set: {
          "sessions.$[session].drills.$[drill].form.$[formField].value":
            field.value,
          "sessions.$[session].drills.$[drill].isComplete": true,
        },
      },
      {
        arrayFilters: [
          { "session._id": sessionId },
          { "drill._id": drillId },
          { "formField._id": field._id },
        ],
      }
    );
  });

  const results = await Promise.all(updatePromises);

  // Check if any document was modified
  const modifiedCount = results.reduce(
    (sum, result) => sum + result.modifiedCount,
    0
  );

  if (modifiedCount === 0) {
    console.log("No documents were modified");
    return res.status(404).json({
      success: false,
      message: "No matching documents found or no changes detected",
    });
  }

  res.json({ success: true, results });
});

// offline Drills

exports.getDrillsAllInputs = catchAsyncError(async (req, res, next) => {
  const { cid, aid } = req.params;
  const unsortedColumns = await DynamicDrillColumns.find();
  const drills = await DynamicDrill.find();

  const desiredOrder = [
    "66c5823f1c2a865bf90c6c45", // Difficulty
    "66c5dd65d5d49f517f72950a", // Drill level
    "66c5825b1c2a865bf90c6c5b", // Color
  ];

  const columns = unsortedColumns.sort((a, b) => {
    const indexA = desiredOrder.indexOf(a._id.toString());
    const indexB = desiredOrder.indexOf(b._id.toString());

    if (indexA === -1 && indexB === -1) {
      // If both columns are not in the desired order, retain their original order
      return 0;
    } else if (indexA === -1) {
      // If column `a` is not in the desired order, but column `b` is, `b` comes first
      return 1;
    } else if (indexB === -1) {
      // If column `b` is not in the desired order, but column `a` is, `a` comes first
      return -1;
    } else {
      // If both columns are in the desired order, sort them according to their order in `desiredOrder`
      return indexA - indexB;
    }
  });

  const sessionNamesArr = await OfflineAtheleteDrillsModel.aggregate([
    {
      $match: {
        client: new mongoose.Types.ObjectId(cid),
        // appointment: new mongoose.Types.ObjectId(aid),
      },
    },

    {
      $project: {
        _id: 0,

        sessionNames: "$sessions.session",
        numOfSessions: "$numOfSessions",
      },
    },
  ]);

  const savedSessions = sessionNamesArr[0]?.sessionNames || [];
  let sessionNames = [];
  for (
    let i = savedSessions.length + 1;
    i <= sessionNamesArr[0]?.numOfSessions;
    i++
  ) {
    sessionNames.push(`Session ${i}`);
  }

  return res.status(200).json({
    success: true,
    data: { columns, drills },
    sessionNames,
  });
});

exports.saveSessions = catchAsyncError(async (req, res, next) => {
  const { cid, aid } = req.params;
  const sessionData = req.body;

  let result = await OfflineAtheleteDrillsModel.findOne({
    client: new mongoose.Types.ObjectId(cid),
    // appointment: new mongoose.Types.ObjectId(aid),
  });

  const updatedDrills = sessionData.sessions[0].drills?.map((item) => {
    if (!item.createdAt) {
      const date = new Date().toISOString();
      const formattedDate = date.replace("Z", "+00:00");
      item.createdAt = formattedDate;
    }
    return { ...item, drill: new mongoose.Types.ObjectId(item.drill) };
  });
  const newSession = { ...sessionData.sessions[0], drills: updatedDrills };

  if (result) {
    result?.sessions?.push(newSession);

    await result.save();
  } else {
    const updatedData = { ...sessionData, sessions: [newSession] };

    result = await OfflineAtheleteDrillsModel.create(updatedData);
  }

  const appointment = await appointmentModel.findById(aid);
  if (appointment.service_status !== "completed") {
    appointment.service_status = "completed";
    await appointment.save();
  }

  await createNotification(
    "Session Completed",
    `You have successfully completed the ${newSession.session} drills`,
    appointment.client
  );
  if (result.sessions.length < result.numOfSessions) {
    await createNotification(
      "Upcoming Drill",
      `Your Session ${
        Number(newSession.session.split(" ")[1]) + 1
      } is pending. Book it now`,
      appointment.client
    );
  }

  res.status(200).json({ success: true, result });
});

exports.getAllSessions = catchAsyncError(async (req, res, next) => {
  const { cid, aid } = req.params;

  const result = await OfflineAtheleteDrillsModel.findOne({
    client: new mongoose.Types.ObjectId(cid),
    // appointment: new mongoose.Types.ObjectId(aid),
  });

  const dynamicDrills = await DynamicDrill.find();

  let drillInputTypes = {};
  dynamicDrills?.forEach((drill) => {
    drillInputTypes[drill._id] = drill.inputs;
  });

  const sessionNames =
    result?.sessions?.reduce((acc, curr) => [...acc, curr.session], []) || [];

  res
    .status(200)
    .json({ success: true, result, sessionNames, drillInputTypes });
});

exports.createBookingService = catchAsyncError(async (req, res, next) => {
  await BookingServiceModel.create(req.body);

  res.status(201).json({ success: true });
});
