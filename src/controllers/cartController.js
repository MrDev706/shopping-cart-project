const userModel = require("../models/userModel");
const productModel = require("../models/productModel");
const cartModel = require("../models/cartModel");
const Validator = require("../validation/validation");

//-----------------------------------------Post Api(create cart with userId)-------------------------------//

const createCart = async function (req, res) {
    try {
        const body = req.body;
        const userId = req.params.userId

        //request body validations
        if (Validator.isValidBody(body)) {
            return res.status(400).send({ status: false, message: "body cant be empty" });
        }

        //productId validations
        if (!body.productId) {
            return res.status(400).send({ status: false, message: ` productId is required` });
        }
        if (!Validator.isValidObjectId(body.productId)) {
            return res.status(400).send({ status: false, message: `invalid productId ` });
        }
        const product = await productModel.findOne({ _id: body.productId, isDeleted: false });

        if (!product) {
            return res.status(404).send({ status: false, message: `Product doesn't exist by ${productId}` });
        }

        //conditions for quantity
        let totalPrice = 0
        if (Object.keys(body).includes("quantity")) {
            if (typeof body.quantity != "number") {
                return res.status(400).send({ status: false, message: ` quantity should be a number` });
            }
            if (body.quantity <= 1) {
                return res.status(400).send({ status: false, message: `quantity must be minimum 1` });
            }
            totalPrice += (product.price * body.quantity)
        } else {
            body.quantity = 1
            totalPrice += product.price
        }

        // creating the cart
        var cart = await cartModel.findOne({ userId: userId, isDeleted: false })
        if (!cart) {
            let cart = {}
            cart.userId = userId
            cart.items = body
            cart.totalPrice = totalPrice
            cart.totalItems = 1
            let createdCart = await cartModel.create(cart)
            //console.log(createdCart.items)
            return res.status(201).send({ status: true, message: "Success", data: createdCart })
        }

        for (let i = 0; i < cart.items.length; i++) {
            if (cart.items[i].productId == body.productId) {
                if (Object.keys(body).includes("quantity")) {
                    cart.items[i].quantity += body.quantity
                } else {
                    cart.items[i].quantity += 1
                }
                let createdCart = await cartModel.findOneAndUpdate({ userId: userId }, { "items": cart.items, totalPrice: cart.totalPrice + totalPrice }, { new: true })
                return res.status(201).send({ status: true, message: "Success", data: createdCart })

            }

        }
        let obj = {
            $push: { "items": body },
            totalPrice: cart.totalPrice + totalPrice,
            totalItems: cart.totalItems + 1
        }
        let createdCart = await cartModel.findOneAndUpdate({ userId: userId }, obj, { new: true })
        res.status(201).send({ status: true, message: "Success", data: createdCart })

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message });
    }
};


//----------------------------------------Put Api(update cart by userId)------------------------------//    

const updateCart = async function (req, res) {
    try {


        let body = req.body
        const userId = req.params.userId

        //validations for body
        if (Validator.isValidBody(body)) {
            return res.status(400).send({ status: false, message: "body cant be empty" });
        }

        //validations for productId
        if (!body.productId) {
            return res.status(400).send({ status: false, message: `please give a productId` });
        }

        if (!Validator.isValidObjectId(body.productId)) {
            return res.status(400).send({ status: false, message: "give a valid productId" });
        }

        const findproductId = await productModel.findById({ _id: body.productId });
        if (!findproductId) {
            return res.status(404).send({ status: false, message: `User doesn't exist by ${body.productId}` });
        }

        //validations for remove product
        if (!Object.keys(body).includes("removeProduct")) {
            return res.status(400).send({ status: false, message: `give removeProduct in body as a key` });
        }

        if (typeof body.removeProduct != "number") {
            return res.status(400).send({ status: false, message: `removeProduct should be a number` });
        }

        if ([1, 0].indexOf(body.removeProduct) === -1) {
            return res.status(400).send({ status: false, message: "removeProduct can only be 1 0r 0" });
        }

        if (body.removeProduct === 1) {
            let cart = await cartModel.findOne({ userId: userId, isDeleted: false })
            if (!cart) return res.status(404).send({ status: false, message: `no cart available for ${userId}` });

            // console.log(cart)
            let totalItems = cart.totalItems
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == body.productId && cart.items[i].quantity >= 1) {
                    cart.items[i].quantity -= 1
                    if (cart.items[i].quantity === 0) {
                        cart.items.splice(i, 1)
                        totalItems -= 1
                    }
                    break;
                }
            }
            let totalPrice = cart.totalPrice - findproductId.price
            let changedCart = await cartModel.findOneAndUpdate({ userId: userId }, { "items": cart.items, totalPrice: totalPrice, totalItems: totalItems }, { new: true })
            res.status(200).send({ status: true, message: "Success", data: changedCart })
        }

        else {
            let cart = await cartModel.findOne({ userId: userId, isDeleted: false })
            if (!cart) return res.status(404).send({ status: false, message: `no cart available for ${userId}` });
            // console.log(cart)
            for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId == body.productId) {
                    let totalPrice = cart.totalPrice - (findproductId.price * cart.items[i].quantity)
                    cart.items.splice(i, 1)
                    let totalItems = cart.totalItems - 1
                    let changedCart = await cartModel.findOneAndUpdate({ userId: userId }, { "items": cart.items, totalPrice: totalPrice, totalItems: totalItems }, { new: true })
                    res.status(200).send({ status: true, message: "Success", data: changedCart })
                }
            }
        }

    } catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message });
    }
};


//----------------------------------------Get Api(getcart by userId)------------------------------//    

const getCart = async function (req, res) {
    try {
        const userId = req.params.userId

        let data = await cartModel.findOne({ userId: userId, isDeleted: false }).populate("items.productId")
        if (!data) {
            return res.status(404).send({ status: false, message: `Cart does not Exist with user id :${userId}` })
        }


        res.status(200).send({ status: true, message: "Success", data: data })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};


//----------------------------------------Delete Api(Delete cart by userId)------------------------------//    

const deleteCart = async function (req, res) {
    try {
        const userId = req.params.userId

        let Cart = await cartModel.findOne({ userId: userId });
        if (!Cart)
            return res.status(404).send({ status: false, message: `No cart with this userId` });

        if (Cart.items.length == 0)
            return res.status(400).send({ status: false, message: "Cart already empty" });

        let deletedData = await cartModel.findOneAndUpdate(
            { _id: Cart._id }, { items: [], totalPrice: 0, totalItems: 0 }, { new: true })

        res.status(204).send({ status: true, message: "Cart successfully removed", data: deletedData })

    } catch (err) {
        res.status(500).send({ status: false, message: err.message });
    }
};





module.exports = { createCart, updateCart, getCart, deleteCart }   