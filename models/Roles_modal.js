const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const RolesSchema = new mongoose.Schema({
    permissions: {
        Dealers: {
            type: {
                create: Boolean,
                // read: Boolean,
                update: Boolean,
                delete: Boolean,
                role: { type: String, default: "Dealer" }             },
            default: {
                create: false,
                // read: false,
                update: false,
                delete: false,
            }
        },
        Booking: {
            type: {
                // create: Boolean,
                // read: Boolean,
                // update: Boolean,
                delete: Boolean,
                role:{type:String,default:'Booking'},

            },
            default: {
                // create: false,
                // read: false,
                // update: false,
                delete: false
            }
        },
        // Payment: {

        //     type: {
        //         create: Boolean,
        //         read: Boolean,
        //         update: Boolean,
        //         delete: Boolean,
        //         role:{type:String,default:'Payment'},

        //     },
        //     default: {
        //         create: false,
        //         read: false,
        //         update: false,
        //         delete: false
        //     }
        // },

        Admin: {

            type: {
                create: Boolean,
                read: Boolean,
                update: Boolean,
                delete: Boolean,
                role:{type:String,default:'Admin'},

            },
            default: {
                create: true,
                read: true,
                update: true,
                delete: true
            }
        },
        Services: {

            type: {
                // create: Boolean,
                // read: Boolean,
                update: Boolean,
                delete: Boolean,
                role:{type:String,default:'Services'},

            },
            default: {
                // create: false,
                // read: false,
                update: false,
                delete: false
            }
        },
        Bikes: {

            type: {
                // create: Boolean,
                // read: Boolean,
                update: Boolean,
                delete: Boolean,
                role:{type:String,default:'Bikes'},

            },
            default: {
                // create: false,
                // read: false,
                update: false,
                delete: false
            }
        },
        Offers: {
            type: {
                // create: Boolean,
                // read: Boolean,
                update: Boolean,
                delete: Boolean,
                role:{type:String,default:'Offers'},

            },
            default: {
                // create: false,
                // read: false,
                update: false,
                delete: false
            }
        },
        Reports: {

            type: {
                // create: Boolean,
                // read: Boolean,
                update: Boolean,
                // delete: Boolean,
                role:{type:String,default:'Reports'},

            },
            default: {
                // create: false,
                // read: false,
                update: false,
                // delete: false
            }
        }
    },
    subAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin"
    }
});

RolesSchema.plugin(AutoIncrement, { id: "role_seq", inc_field: "id" });

module.exports = mongoose.model("role", RolesSchema);

