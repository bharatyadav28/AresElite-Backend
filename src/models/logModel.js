const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: String,
});

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
