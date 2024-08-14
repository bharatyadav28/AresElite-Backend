const mongoose = require("mongoose");
const dotenv= require("dotenv")
dotenv.config()

const connectDB = async () => {
  try {
    const connect = await mongoose.connect(process.env.DB_URL);
    console.log("Connect Pass");
  } catch (err) {
    console.log("Connect Failed", err);
    process.exit(1);
  }
};

module.exports = connectDB;