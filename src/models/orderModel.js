const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;

const orderSchema = new mongoose.Schema(
    {
        userId:
        {
            type: ObjectId,
            refs: "User",
            required: true
        },

        items: [{
            _id:false,
            productId:
            {
                type: ObjectId,
                ref: "Product",
                required: true
            },

            quantity:
            {
                type: Number,
                required: true
            },

        }],

        totalPrice:
        {
            type: Number,
            required: true
        },

        totalItems:
        {
            type: Number,
            required: true
        },

        totalQuantity:
        {
            type: Number,
            required: true
        },

        cancellable:
        {
            type: Boolean,
            default: true
        },

        status:
        {
            type: String,
            default: "pending",
            enum: ["pending", "completed", "cancled"]
        },

        deletedAt:
        {
            type: Date,
            default:null
        },

        isDeleted:
        {
            type: Boolean,
            default: false
        },
    }
)

module.exports = mongoose.model("Order", orderSchema);