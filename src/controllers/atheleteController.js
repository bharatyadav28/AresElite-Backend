const appointmentModel = require("../models/appointmentModel");
const catchAsyncError = require("../utils/catchAsyncError");
const userModel = require("../models/userModel");
const ErrorHandler = require("../utils/errorHandler");
const { resetPasswordCode, newAccount } = require("../utils/mails");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const {
  Types: { ObjectId },
} = require("mongoose");
const generateCode = require("../utils/generateCode");
const { s3Uploadv2, s3UpdateImage } = require("../utils/aws.js");
const transactionModel = require("../models/transactionModel");
const DrillFormModel = require("../models/DrillFormModel.js");
const ShipmentModel = require("../models/shipment.js");
const DrillForm = require("../models/DrillModel.js");
const PrescriptionsForm = require("../models/PrescriptionForm.js");
const EvaluationForm = require("../models/EvaluationForms.js");
const OfflineDrill = require("../models/offlineDrillModel.js");
const OfflineAtheleteDrillsModel = require("../models/OfflineAtheleteDrills.js");
const TeleSessionsModel = require("../models/TeleSessionsModel.js");
const { hasTimePassed } = require("../utils/functions.js");

exports.register = catchAsyncError(async (req, res, next) => {
  const {
    firstName,
    lastName,
    suffix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
    is_online,
    password,
    mode,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !suffix ||
    !email ||
    !city ||
    !phone ||
    !state ||
    !dob ||
    !gender ||
    !address ||
    !zip ||
    !password
  ) {
    return next(new ErrorHandler("Please enter all the fields"));
  }

  let user = await userModel.findOne({ email });
  if (user)
    return next(new ErrorHandler("User already exists with this email", 400));
  if (password.length < 8)
    return next(
      new ErrorHandler("Password should have minimum 8 characters", 400)
    );

  user = await userModel.create({
    firstName,
    lastName,
    profilePic: "picture",
    suffix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
    is_online,
    password,
    role: "athlete",
    mode: "N.A.",
  });
  newAccount(email, `${firstName}${lastName}`, password);
  await user.save();

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
});

exports.login = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password)
    return next(new ErrorHandler("Please enter your email and password", 400));

  const user = await userModel
    .findOne({ email: { $regex: new RegExp(email, "i") } })
    .select("+password");
  if (user.role !== "athlete") {
    return next(new ErrorHandler("Unauthorized! Access Denied ", 400));
  }

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched)
    return next(new ErrorHandler("Invalid email or password!", 401));

  const token = user.getJWTToken();
  res.status(201).json({ user, token });
});

exports.sendForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  const code = generateCode(6);

  await userModel.findOneAndUpdate({ email }, { temp_code: code });
  resetPasswordCode(email, user.fullname, code);

  res.status(200).json({
    success: true,
    message: "Code sent to your email.",
  });
});

exports.validateForgotPasswordCode = catchAsyncError(async (req, res, next) => {
  const { email, code } = req.body;
  const user = await userModel.findOne({ email });

  if (!user) return next(new ErrorHandler("User Not Found.", 404));

  if (user.temp_code === code) {
    user.temp_code = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Code Validated Successfully.",
    });
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
  const isPasswordMatched = await user.comparePassword(newPassword);
  if (isPasswordMatched)
    return next(new ErrorHandler("Cannot use old password", 400));
  user.password = newPassword;
  await user.save();

  res.status(203).json({ message: "Password Updated Successfully." });
});

exports.getProfile = catchAsyncError(async (req, res, next) => {
  const { userId } = req;
  const athlete = await userModel.findById(userId).select("-password");
  res.status(200).json({ athlete });
});

exports.editProfile = catchAsyncError(async (req, res, next) => {
  const file = req.file;
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  req.userId = userId;
  const {
    firstName,
    lastName,
    suffix,
    email,
    city,
    phone,
    state,
    dob,
    gender,
    address,
    zip,
  } = req.body;
  const athlete = await userModel.findById(userId).select("-password");
  // const result = await s3UpdateImage(file, athlete.profilePic);
  // const location = result.Location && result.Location;

  firstName && (athlete.firstName = firstName);
  lastName && (athlete.lastName = lastName);
  file && (athlete.profilePic = location);
  suffix && (athlete.suffix = suffix);
  gender && (athlete.gender = gender);
  dob && (athlete.dob = dob);
  address && (athlete.address = address);
  city && (athlete.city = city);
  zip && (athlete.zip = zip);
  state && (athlete.state = state);
  email && (athlete.email = email);
  phone && (athlete.phone = phone);

  await athlete.save();

  res.status(200).json({ athlete });
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

exports.getBookings = catchAsyncError(async (req, res, next) => {
  const page = parseInt(req.query.page_no) || 1;
  const limit = parseInt(req.query.per_page_count) || 10;
  const { service_type, status, service_status } = req.query;

  const query = {};

  if (status) query.status = status;

  if (service_type) query.service_type = service_type;

  if (service_status) query.service_status = service_status;

  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  const doctors = await userModel.find({ role: "doctor" });
  req.userId = userId;
  let sortedAppointments = [];

  const appointments = await appointmentModel
    .find({
      $or: [
        { "client._id": new ObjectId(userId), ...query },
        { client: userId, ...query },
      ],
    })
    .sort({ createdAt: "desc" })
    .skip((page - 1) * limit)
    .limit(limit);
  appointments.map((app) => {
    let appoint = {
      ...app._doc,
      doctorData: doctors.map((doc) => {
        if (app.doctor_trainer === doc.firstName) {
          return { email: doc.email, profilePic: doc.profilePic };
        }
      }),
    };
    appoint && sortedAppointments.push(appoint);
  });
  res.status(200).json({
    success: true,
    sortedAppointments,
  });
});

exports.getTransactions = catchAsyncError(async (req, res, next) => {
  const { date, service_type, plan, phase } = req.query;
  const fdate = new Date(date);
  fdate.setUTCHours(0, 0, 0, 0);
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );
  let query = { clientId: new mongoose.Types.ObjectId(userId) };
  if (date) {
    query.date = fdate;
  }
  if (service_type) {
    query.service_type = service_type;
  }
  if (plan) {
    query.plan = plan;
  }
  if (phase) {
    query.phase = phase;
  }

  const transactions = await transactionModel.find(query);

  res.status(200).json({
    success: true,
    message: "Fetched transactions",
    transactions: transactions,
  });
});

exports.dashboard = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  const userDetails = await userModel.findById(userId);
  if (userDetails.is_online) {
    const isDrill = await DrillFormModel.find({ clientId: userId });
    const shipment = await ShipmentModel.find({
      ClientId: new mongoose.Types.ObjectId(userId),
    }).select(
      "-shippingAddress -productDescription -productImages -ClientId -plan -phase"
    );

    const upcomingAppointment = await appointmentModel.findOne({
      client: userDetails._id.toString(),
      service_type: "TeleSession",
      service_status: "upcoming",
    });

    const isAppointmentComplete = hasTimePassed(
      upcomingAppointment?.app_date,
      upcomingAppointment?.app_time
    );

    const offlineDrillsData = await OfflineAtheleteDrillsModel.findOne({
      client: new mongoose.Types.ObjectId(userDetails._id),
    });
    console.log("OfflineDrillsData:", offlineDrillsData);
    let offlineDrills = offlineDrillsData
      ? offlineDrillsData.numOfSessions - offlineDrillsData.sessions.length
      : 0;

    offlineDrills = offlineDrills < 0 ? 0 : offlineDrills;

    const teleBookingsData = await TeleSessionsModel.findOne({
      user: new mongoose.Types.ObjectId(userDetails._id),
    });

    if (upcomingAppointment && isAppointmentComplete) {
      upcomingAppointment.service_status = "completed";
      upcomingAppointment.save();

      teleBookingsData.count = teleBookingsData.count - 1;
      teleBookingsData.save();
    }

    let teleBookings = teleBookingsData?.count;
    teleBookings = teleBookings < 0 ? 0 : teleBookings;

    if (isDrill.length > 0) {
      const calcPipe = [
        {
          $match: {
            clientId: new mongoose.Types.ObjectId(userId),
          },
        },
        {
          $unwind: "$drill",
        },
        {
          $group: {
            _id: "$_id",
            totalActivities: { $sum: { $size: "$drill.activities" } },
            completedActivities: {
              $sum: {
                $size: {
                  $filter: {
                    input: "$drill.activities",
                    as: "activity",
                    cond: { $eq: ["$$activity.isComplete", true] },
                  },
                },
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalActivities: 1,
            completedActivities: 1,
          },
        },
      ];

      const pipelineForActiveDay = [
        {
          $match: {
            $or: [
              {
                clientId: new mongoose.Types.ObjectId(userId),
              },
              {
                clientId: new mongoose.Types.ObjectId(userId),
              },
            ],
          },
        },
        {
          $unwind: "$drill",
        },
        {
          $unwind: "$drill.activities",
        },
        {
          $group: {
            _id: null,
            activeDay: {
              $push: {
                $cond: {
                  if: "$drill.activities.isComplete",
                  // then: {  $concat: [{ $toInt: "$drill.week" }, "-", "$drill.day", " for ", { $toString: "$drill.activities.isComplete" }] },
                  then: {
                    week: "$drill.week",
                    day: "$drill.day",
                    status: { $toString: "$drill.activities.isComplete" },
                  },
                  // then: 'd',
                  else: {
                    week: "$drill.week",
                    day: "$drill.day",
                    status: { $toString: "$drill.activities.isComplete" },
                  },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: null,
            activeDay: { $push: "$activeDay" },
          },
        },
      ];

      const drillday = await DrillFormModel.aggregate(pipelineForActiveDay);
      const drill = await DrillFormModel.aggregate(calcPipe);

      const runner = (drill) => {
        return {
          totalDrills: drill[0].totalActivities,
          completedDrills: drill[0].completedActivities,
          drillProgress:
            (drill[0].completedActivities / drill[0].totalActivities) * 100,

          teleSessions: { offlineDrills, teleBookings },
        };
      };

      function findFalseStatus(activities) {
        for (const activity of activities) {
          if (activity.status === "false") {
            return {
              week: parseInt(activity.week),
              day: parseInt(activity.day),
            };
          }
        }
        return null;
      }

      return res.status(200).json({
        success: true,
        userDetails,
        drillActiveStatus:
          drillday[0] !== undefined
            ? findFalseStatus(drillday[0].activeDay[0])
            : { week: 1, day: 1 },
        drillDetails: runner(drill),
        shipment,
        isShipment: Boolean(shipment),
      });
    }

    return res.status(200).json({
      success: true,
      userDetails,
      drillActiveStatus: { week: 0, day: 0 },
      drillDetails: {
        totalDrills: 0,
        completedDrills: 0,
        drillProgress: 0,
        teleSessions: { offlineDrills, teleBookings },
      },
      shipment,
      isShipment: Boolean(shipment),
    });
  } else {
    // const lineForTotalIsBooked = [
    //   {
    //     $match: {
    //       clientId: new mongoose.Types.ObjectId(userId),
    //     },
    //   },
    //   {
    //     $unwind: "$sessions",
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalSessions: { $sum: 1 },
    //       bookedSessions: {
    //         $sum: {
    //           $cond: ["$sessions.isBooked", 1, 0],
    //         },
    //       },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       totalSessions: 1,
    //       bookedSessions: 1,
    //     },
    //   },
    // ];
    // const testClient = await OfflineDrill.findOne({
    //   clientId: new mongoose.Types.ObjectId("66d9e4cb904ec8d3a774c729"),
    // });
    // console.log(testClient);

    const sessionResult = await OfflineAtheleteDrillsModel.findOne({
      client: new mongoose.Types.ObjectId(userId),
    });

    // console.log(lineForTotalIsBooked)
    // const sessionResult = await OfflineDrill.aggregate(lineForTotalIsBooked);
    // console.log(sessionResult)
    const shipment = await ShipmentModel.find({
      ClientId: new mongoose.Types.ObjectId(userId),
    }).select(
      "-shippingAddress -productDescription -productImages -ClientId -plan -phase"
    );

    const drillsData = await OfflineAtheleteDrillsModel.findOne({
      client: new mongoose.Types.ObjectId(userId),
      // appointment: new mongoose.Types.ObjectId(aid),
    });

    const sessionNames =
      drillsData?.sessions?.reduce((acc, curr) => [...acc, curr.session], []) ||
      [];

    const drills = {
      drillsData: drillsData || {},
      sessionNames: sessionNames || [],
    };

    return res.status(200).json({
      success: true,
      userDetails,
      sessionDetails: {
        totalSessions: sessionResult?.numOfSessions,
        completedSessions: sessionResult?.sessions.length,
        // sessionProgress: (sessionResult[0].bookedSessions / sessionResult[0].totalSessions) * 100
      },
      shipment,
      isShipment: Boolean(shipment),
      drills,
    });
  }
});

exports.shipment = catchAsyncError(async (req, res, next) => {
  const { userId } = jwt.verify(
    req.headers.authorization.split(" ")[1],
    process.env.JWT_SECRET
  );

  const shipment = await ShipmentModel.findOne({
    ClientId: new mongoose.Types.ObjectId(userId),
  });

  if (!shipment) {
    return next(new ErrorHandler("No shipment found", 400));
  }
  return res.status(200).json({
    success: true,
    shipment,
  });
});

// ==========================APPOINTMENT STUFF =============================================>

exports.getUpcomingAppointments = catchAsyncError(async (req, res, next) => {
  const currentDateTime = new Date();
  const currentDate = currentDateTime.toISOString().split("T")[0];
  const currentTime = currentDateTime.toTimeString().split(" ")[0].slice(0, 5);
  const upcomingAppointments = await appointmentModel
    .find({
      app_date: currentDate, // Current date
      app_time: { $gte: currentTime }, // Time greater than or equal to current time
    })
    .select("app_date app_time -client");

  if (!upcomingAppointments) {
    return next(new ErrorHandler("No upcoming appointments found", 404));
  }

  res.status(200).json({ upcomingAppointments });
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

  let appointments = [];

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
      const Evalform = await EvaluationForm.find({
        appointmentId: appoint._id,
      });
      let appointmentWithEval = {
        ...appoint.toObject(),
        isFilled: Boolean(Presform.length),
        presId: Boolean(Presform.length) ? Presform[0]._id : null,
        evalId: Boolean(Evalform.length) ? Evalform[0]._id : null,
      };
      appointments.push(appointmentWithEval);
    })
  );

  const totalRecords = appointments.length;
  res.json({
    appointments: appointments,
    totalPages: Math.ceil(totalRecords / limit),
    currentPage: page,
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

exports.cancelBooking = catchAsyncError(async (req, res, next) => {
  const { id } = req.params;
  if (!id) {
    return next(new ErrorHandler("Booking id not provided !"));
  }

  const appointment = await appointmentModel.findById(id);

  if (
    appointment.service_status === "completed" ||
    appointment.service_status === "cancelled"
  ) {
    return next(
      new ErrorHandler("Booking is already cancelled or completed !")
    );
  }
  if (
    !["OfflineVisit", "TeleSession", "AddTrainingSessions"].includes(
      appointment.service_type
    )
  ) {
    return next(
      new ErrorHandler(
        "Booking canceliation is not allowed for this service type !"
      )
    );
  }

  appointment.service_status = "cancelled";

  appointment.save();

  return res.status(200).json({
    success: true,
    message: "Booking cancelled successfully",
    appointment,
  });
});

exports.alreadyBookedAppointment = catchAsyncError(async (req, res, next) => {
  const { uid } = req.params;
  if (!uid) {
    return next(new ErrorHandler("Booking id not provided !"));
  }

  const appointments = await appointmentModel.find({
    client: uid,
    service_type: {
      $in: ["OfflineVisit", "TeleSession", "AddTrainingSessions"],
    },
    service_status: "upcoming",
  });

  if (appointments.length > 0) {
    return next(new ErrorHandler("You have already booked an appointment !"));
  }

  return res.status(200).json({
    success: true,
  });
});
