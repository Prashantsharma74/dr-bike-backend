const mongoose = require("mongoose");

const suadminSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    role: String,
    password: {
      type: String,
      select: false,
    },
    mobile: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    employeeId: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

// module.exports = mongoose.model("Admin", suadminSchema);
module.exports = mongoose.model("admin", suadminSchema);
