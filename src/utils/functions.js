const mongoose = require("mongoose");
const ServiceModel = require("../models/ServiceTypeModel");
const notificationModel = require("../models/notificationModel");
const catchAsyncError = require("./catchAsyncError");
const BookingServiceModel = require("../models/BookingService.js");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");

dayjs.extend(customParseFormat);

const serviceDurations = {
  MedicalOfficeVisit: 30,
  Consultation: 15,
  SportsVision: 90,
  ConcussionEval: 60,
  null: 0,
};

const timeForService = async (alias) => {
  const timeCache = new Map();
  if (timeCache.has(alias)) {
    return timeCache.get(alias);
  }

  let time = serviceDurations[alias];

  if (typeof time === "undefined") {
    const service = await ServiceModel.findOne({ alias }).select("+duration");
    const bservice = await BookingServiceModel.findOne({ alias }).select(
      "+duration"
    );

    if (!service && !bservice) {
      return;
    }
    time = service ? service.duration : bservice.duration;
    console.log(time, bservice);

    timeCache.set(alias, time); // Cache the result
  }

  return time;
};

const convertTo24HourFormat = (time12Hour) => {
  const [hour, minute, period] = time12Hour
    .match(/(\d+):(\d+)\s*(AM|PM)/i)
    .slice(1);
  if (!hour || !minute || !period) {
    console.error("Invalid time format");
    return "Invalid Date";
  }
  let hours = parseInt(hour);
  const minutes = parseInt(minute);
  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }
  const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:00`;
  return formattedTime;
};

const timeValidate = (service_type, validateTo, inputTime) => {
  let time = timeForService(service_type);
  const input = new Date(`2024-02-05T${convertTo24HourFormat(inputTime)}`);
  const target = new Date(`2024-02-05T${convertTo24HourFormat(validateTo)}`);
  const timeDifference = Math.abs(input.getTime() - target.getTime());
  const result = timeDifference <= time * 60 * 1000;
  return result;
};

const sendData = (user, statusCode, res) => {
  const token = user.getJWTToken();

  res.status(statusCode).json({
    status: "user login successfully",
    user_data: user,
    token,
  });
};

const timeDiff = async (service_type, time1, time2) => {
  const serviceTime = await timeForService(service_type);
  const [hours1, minutes1] = convertTo24HourFormat(time1)
    .split(":")
    .map(Number);

  const [hours2, minutes2] = convertTo24HourFormat(time2)
    .split(":")
    .map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;
  const differenceInMinutes = totalMinutes2 - totalMinutes1;

  if (differenceInMinutes > serviceTime) {
    const currentMinutes = totalMinutes1 + serviceTime;
    const hours = Math.floor(currentMinutes / 60) % 24;
    const minutes = currentMinutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const timeString = `${formattedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;

    return timeString;
  }

  return time2;
};

const calculateTimeDifference = async (time1, serviceType, time2, duration) => {
  // console.log("Service Type", serviceType);
  const [hours1, minutes1] = addDuration(
    convertTo24HourFormat(time1),
    await timeForService(serviceType)
  )
    .split(":")
    .map(Number);

  const [hours2, minutes2] = convertTo24HourFormat(time2)
    .split(":")
    .map(Number);

  const totalMinutes1 = hours1 * 60 + minutes1;
  const totalMinutes2 = hours2 * 60 + minutes2;

  const differenceInMinutes = Math.abs(totalMinutes2 - totalMinutes1);

  const piecesCount = Math.floor(
    differenceInMinutes / (await timeForService(duration))
  );

  const timeDiffInPieces = [];

  for (let i = 0; i < piecesCount; i++) {
    const currentMinutes = totalMinutes1 + i * (await timeForService(duration));
    const hours = Math.floor(currentMinutes / 60) % 24;
    const minutes = currentMinutes % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 || 12; // Convert 0 to 12
    const timeString = `${formattedHours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")} ${ampm}`;
    timeDiffInPieces.push(timeString);
  }

  console.log("sdsd", timeDiffInPieces);

  return timeDiffInPieces;
};

const addDuration = (startTime, durationMinutes) => {
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const totalStartMinutes = startHour * 60 + startMinute;
  const totalEndMinutes = totalStartMinutes + durationMinutes;
  const endHour = Math.floor(totalEndMinutes / 60);
  const endMinute = totalEndMinutes % 60;
  const formattedEndTime = `${String(endHour).padStart(2, "0")}:${String(
    endMinute
  ).padStart(2, "0")}`;
  return formattedEndTime;
};

const filterBookedSlots = (slots, userAppointments) => {
  console.log(slots);
  console.log("User Appoint", userAppointments);
  // Assuming slots are structured as [[startTime, endTime], [startTime, endTime], ...]
  return slots.filter((slot) => {
    const [slotStart, slotEnd] = slot;
    return !userAppointments.some((app) => {
      const appTime = app.app_time; // Assuming this is the appointment time
      return appTime >= slotStart && appTime < slotEnd; // If appointment falls in this slot, exclude it
    });
  });
};

const createArrayOfPairs = (arr) => {
  const pairsArray = [];

  for (let i = 0; i < arr.length; i += 2) {
    pairsArray.push([arr[i], arr[i + 1]]);
  }

  return pairsArray;
};

const createNotification = async (title, text, user, doctor) => {
  console.log("d", doctor);
  try {
    const notification = await notificationModel.create({
      title,
      text,
      user: new mongoose.Types.ObjectId(user),
      doctor,
    });

    // If notification is created successfully, log it and return true
    console.log("Notification created:", notification);
    return true;
  } catch (e) {
    // Log the error and return false
    console.error("Error creating notification:", e);
    return false;
  }
};

function hasTimePassed(dateStr, timeStr) {
  // Parse the date part using ISO format
  const date = dayjs(dateStr); // Parses the ISO date (e.g., 2024-09-05T00:00:00.000)

  // Check if date parsing failed
  if (!date.isValid()) {
    console.error("Invalid date format");
    return false;
  }

  // Parse the time part separately
  const time = dayjs(timeStr, "hh:mm A");

  // Check if time parsing failed
  if (!time.isValid()) {
    console.error("Invalid time format");
    return false;
  }

  // Set the parsed time on the given date
  const givenDateTime = date.hour(time.hour()).minute(time.minute());

  // Get the current date and time
  const now = dayjs();

  // Compare the given date-time with the current time
  return now.isAfter(givenDateTime);
}

function sortServices(services) {
  const customOrder = [
    "Sports Vision Performance Evaluation",
    "Glasses Exam",
    "Contact Lens Exam",
    "Post-Concussion Evaluation",
    "Medical/Office Visit",
    "Consultation Call",
  ];

  services.sort((a, b) => {
    const indexA = customOrder.indexOf(a.name);
    const indexB = customOrder.indexOf(b.name);

    if (indexA === -1 && indexB === -1) {
      return 0;
    }
    if (indexA === -1) {
      return 1;
    }
    if (indexB === -1) {
      return -1;
    }
    return indexA - indexB;
  });

  return services;
}

module.exports = {
  filterBookedSlots,
  addDuration,
  timeForService,
  createArrayOfPairs,
  calculateTimeDifference,
  sendData,
  timeValidate,
  createNotification,
  hasTimePassed,
  timeDiff,
  convertTo24HourFormat,
  sortServices,
};
