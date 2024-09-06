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
    time = service ? service.duration : bservice.duration;

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

const calculateTimeDifference = async (time1, serviceType, time2, duration) => {
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

  const piecesCount = Math.ceil(
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

const createArrayOfPairs = (arr) => {
  const pairsArray = [];

  for (let i = 0; i < arr.length; i += 2) {
    pairsArray.push([arr[i], arr[i + 1]]);
  }

  return pairsArray;
};

const createNotification = catchAsyncError(async (title, text, user) => {
  try {
    const notification = await notificationModel.create({
      title,
      text,
      user: new mongoose.Types.ObjectId(user),
    });
    notification.save();
    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
});

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

module.exports = {
  addDuration,
  timeForService,
  createArrayOfPairs,
  calculateTimeDifference,
  sendData,
  timeValidate,
  createNotification,
  hasTimePassed,
};
