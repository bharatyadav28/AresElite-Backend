const mongoose = require('mongoose')

const prescriptionSchema = new mongoose.Schema({
   firstField: {
      type: String,
      required: [true, "Required"],
      enum: ["1"]
   },
})

module.exports = mongoose.model('prescription', prescriptionSchema)
