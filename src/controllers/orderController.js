
const orderModel = require("../models/orderModel");
const cartModel = require("../models/cartModel")
const Validator = require("../validation/validation")

//---------------------------Post Api(create order with userId)----------------------------------//

const createOrder = async function (req, res) {

    try {
        const body = req.body
        if (!body.cartId) {
            return res.status(400).send({ status: false, message: "CartId is required" })
        }
        if (!Validator.isValidObjectId(body.cartId)) {
            return res.status(400).send({ status: false, message: "please provide a valid cart ObjectId" })
        }
        let cartDetails = await cartModel.findOne({ _id: body.cartId }).select({ _id: 0, userId: 1, items: 1, totalPrice: 1, totalItems: 1 })

        if (!cartDetails) {
            return res.status(404).send({ status: false, message: "no cart found" })

        }
        if (cartDetails.items.length === 0) {
            return res.status(400).send({ status: false, message: "please add products to cart to place an order." })
        }
        if (cartDetails.userId != req.params.userId) {
            return res.status(401).send({ status: false, message: "the cart Id that you have given is not yours" })
        }

        let { userId, items, totalPrice, totalItems } = cartDetails

        let cart = {
            userId: userId,
            items: items,
            totalPrice: totalPrice,
            totalItems: totalItems
        }
        let totalQuantity = 0
        for (let i = 0; i < cartDetails.items.length; i++) {
            totalQuantity += cart.items[i].quantity
        }
        cart.totalQuantity = totalQuantity

        if (body.cancellable) {
            if (typeof body.cancellable != "boolean") {
                return res.status(400).send({ status: false, message: "cancellable should be a boolean" })
            }
            if (["true", "false"].indexOf(body.cancellable) == -1) {
                return res.status(400).send({ status: false, message: "canellable can either be true or false" })
            }
            cart.cancellable = body.cancellable
        }

        // if (body.status) {
        //     if (typeof body.status != "string") {
        //         return res.status(400).send({ status: false, message: "status should be a string" })
        //     }
        //     if (["pending", "completed", "canceled"].indexOf(body.status) == -1) {
        //         return res.status(400).send({ status: false, message: "status can only be pending, completed, canceled" })
        //     }
        //     cart.status = body.status
        // }
        let createdOrder = await orderModel.create(cart)
        await cartModel.findOneAndUpdate({ _id: body.cartId }, { items: [], totalPrice: 0, totalItems: 0 })
        res.status(201).send({ status: true, message: "Success", data: createdOrder })

    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message });
    }

}


//---------------------------Put Api(update order by userId)-------------------------------//

const updateOrder = async function (req, res) {

    try {

        let body = req.body
        if (!body.orderId) {
            return res.status(400).send({ status: false, message: "OrderId is required" })
        }
        if (!Validator.isValidObjectId(body.orderId)) {
            return res.status(400).send({ status: false, message: "please provide a valid order ObjectId" })
        }
        let order = await orderModel.findOne({ _id: body.orderId })
        if (!order) {
            return res.status(400).send({ status: false, message: "OrderId doesn't exist" })
        }
        if(order.userId!=req.params.userId){
            return res.status(401).send({ status: false, message: "this is not your orderId" })
        }

        if (!body.status) {
            return res.status(400).send({ status: false, message: "please provide a status to update" })
        }
        if (typeof body.status != "string") {
            return res.status(400).send({ status: false, message: "status should be a string" })
        }
        if (["pending", "completed", "canceled"].indexOf(body.status) == -1) {
            return res.status(400).send({ status: false, message: "status can only be pending, completed, canceled" })
        }
        if(body.status === "canceled"){
            if(order.status==="completed"){
                return res.status(400).send({status:false,message:"you can't cancel an order after it's completion"})
            }
            if(order.cancellable===true && order.status==="pending"){
                let updatedOrder = await orderModel.findOneAndUpdate({_id:body.orderId},{status:"canceled"},{new:true})
                return res.status(200).send({status:true,message:"Success",data:updatedOrder})
            }
            else{
                return res.status(400).send({ status: false, message: "order can't be canceled because it is not cancelable" })

            }
        }
        if(body.status === "completed"){
            if(order.status!="pending"){
                return res.status(400).send({ status: false, message: "order can't be completed because it is either already completed or it is canceled" })
            }
            let updatedOrder = await orderModel.findOneAndUpdate({_id:body.orderId},{status:"completed"},{new:true})
                return res.status(200).send({status:true,message:"Success",data:updatedOrder})
        }
        if(body.status === "pending"){
            if(order.status === "completed"||order.status === "canceled"){
                return res.status(400).send({status:false, message:"You can't set the status pending to a cancelled or completed order."})
            }
            return res.status(200).send({status:true,message:"Success",data:order})
        }

    }
    catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
}

module.exports = { createOrder, updateOrder } 