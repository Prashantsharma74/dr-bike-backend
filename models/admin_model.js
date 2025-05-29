const mongoose = require("mongoose");

const suadminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["Telecaller", "Manager", "Admin", "Subadmin", "Executive"],
      required: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    mobile: { type: String, required: true },
    image: { type: String },
    employeeId: { type: String, unique: true, required: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true,
  }
);

suadminSchema.pre("validate", async function (next) {
  if (!this.employeeId) {
    const rolePrefixes = {
      Telecaller: "tele",
      Manager: "manager",
      Admin: "admin",
      Subadmin: "subadmin",
      Executive: "executive",
    };

    const prefix = rolePrefixes[this.role];
    if (!prefix) {
      return next(new Error("Invalid role"));
    }

    const regex = new RegExp(`^${prefix}(\\d+)$`);

    const lastEmployee = await this.constructor
      .findOne({ employeeId: { $regex: regex } })
      .sort({ employeeId: -1 })
      .exec();

    let maxNumber = 0;
    if (lastEmployee) {
      const match = lastEmployee.employeeId.match(regex);
      if (match && match[1]) {
        maxNumber = parseInt(match[1], 10);
      }
    }

    const nextNumber = (maxNumber + 1).toString().padStart(3, "0");
    this.employeeId = `${prefix}${nextNumber}`;
  }
  next();
});

module.exports = mongoose.model("admin", suadminSchema);
