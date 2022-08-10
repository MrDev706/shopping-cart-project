const productModel = require("../models/productModel");
const { uploadFile } = require("../aws/aws");
const Validator = require("../validation/validation");

const createProduct = async function (req, res) {
  try {
    let data = JSON.parse(JSON.stringify(req.body));
    let files = req.files;
    // let { title, description, price, currencyId, currencyFormat, availableSizes } = data;


    if (Validator.isValidBody(data)) {
      return res.status(400).send({ status: false, message: "Product data is required" });
    }

    //validation for title
    if (!Validator.isValidInputValue(data.title)) {
      return res.status(400).send({ status: false, message: "title is required" });
    }
    if (!isNaN(parseInt(data.title))) {
      return res.status(400).send({ status: false, message: "title should be string" });
    }

    if (await productModel.findOne({ title: data.title })) {
      return res.status(400).send({ status: false, message: "title already exists" })
    }

    //validation for description
    if (!Validator.isValidInputValue(data.description)) {
      return res.status(400).send({ status: false, message: "Description is required" });
    }

    //validation for price
    if (!data.price) {
      return res.status(400).send({ status: false, message: "price is required" });
    }

    if (isNaN(parseInt(data.price))) {
      return res.status(400).send({ status: false, message: "price should be Number" });
    }

    data.price = parseInt(data.price)

    // //validations for currencyId
    // if (!Validator.isValidInputValue(data.currencyId)) {
    //   return res.status(400).send({
    //     status: false,
    //     message: "currencyID is required "
    //   });
    // }
    data.currencyId = "INR"
    data.currencyFormat = "₹"

    // // validations for currencyFormat
    // if (!Validator.isValidInputValue(data.currencyFormat)) {
    //   return res.status(400).send({
    //     status: false,
    //     message: "currencyFormat is required "
    //   });
    // }

    //validation for isFreeShipping
    if (data.isFreeShipping) {
      if (["true", "false"].indexOf(data.isFreeShipping) == -1) {
        return res.status(400).send({ status: false, message: "free shipping can only be true or false" });
      }

      if (data.isFreeShipping === "True") {
        data.isFreeShipping = true
      }
      else {
        data.isFreeShipping = false
      }
    }

    // validations for availableSize
    if (!data.availableSizes) {
      return res.status(400).send({ status: false, message: "available sizes is required " });
    }

    let sizeArr = data.availableSizes.split(",")
    if (sizeArr.length == 1) {
      if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[0]) == -1) {
        return res.status(400).send({ status: false, message: "available sizes should be among S,XS,M,X,L,XXL,XL" });
      }
      data.availableSizes = sizeArr
    }

    else {
      for (let i = 0; i < sizeArr.length; i++) {
        if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[i]) === -1) {
          return res.status(400).send({ status: false, message: "available sizes should be among S,XS,M,X,L,XXL,XL" });
        }
      }
      data.availableSizes = sizeArr
    }

    //validations for installments
    if (data.installments) {
      if (isNaN(parseInt(data.installments))) {
        return res.status(400).send({ status: false, message: "Installments should be a number" });
      }
      data.installments = parseInt(data.installments)
    }

    //validations for product image

    if (data.hasOwnProperty("productImage") || !files) {
      return res.status(400).send({ status: false, message: "productImage is required" });
    }
    if (files.length == 0) {
      return res.status(400).send({ status: false, message: "No product image found" });
    }

    if (!Validator.isValidImageType(files[0].mimetype)) {
      return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
    }

    //uploading the photo
    let fileUrl = await uploadFile(files[0]);
    data.productImage = fileUrl;

    // validation for style
    if (data.style) {
      if (!isNaN(parseInt(data.style))) {
        return res.status(400).send({ status: false, message: "Style can't be a string" });
      }

      if (typeof data.style == "string" && data.style.trim().length === 0) {
        return res.status(400).send({ status: false, message: "style can't be empty" });
      }
    }

    let savedData = await productModel.create(data);
    return res.status(201).send({ status: true, message: "Success", data: savedData });

  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
};

//---------------------------------------Get Api(getProduct by Filter)-------------------------------------------//

const getProduct = async function (req, res) {
  try {

    let filter = req.query
    let name = filter.name
    let size = filter.size
    let priceGreaterThan = filter.priceGreaterThan
    let priceLessThan = filter.priceLessThan
    let priceSort = filter.priceSort
    const getproduct = { isDeleted: false };

    let nameIncludes = new RegExp(`${filter.name}`, "gi");

    if (name) {
      getproduct["title"] = nameIncludes
    }

    if (size) {
      var available = size.toUpperCase().split(",")
      getproduct["availableSizes"] = { $all: available }
    }

    if (priceLessThan) {
      getproduct["price"] = { $lt: priceLessThan }
    }
    if (priceGreaterThan) {
      getproduct["price"] = { $gt: priceGreaterThan }
    }
    if (priceGreaterThan && priceLessThan) {
      getproduct["price"] = { $gt: priceGreaterThan, $lt: priceLessThan }
    }

    let data = await productModel.find(getproduct).select({ _v: 0 })//.sort(priceSort)
    if (data.length == 0) {
      return res.status(404).send({ status: false, message: "NO data found" });
    }
    if (filter.priceSort) {
      priceSort = priceSort.toString().trim()
      if (["1", "-1"].indexOf(filter.priceSort) == -1) {
        return res.status(400).send({ status: false, message: `value of priceSort must be 1 or -1 ` })
      }
      if (priceSort === "1") {
        data = data.sort(function (a, b) {
          return a.price - b.price
        })
      }
      if (priceSort === "-1") {
        data = data.sort(function (a, b) {
          return b.price - a.price
        })
      }
    }
    //  data = data.sort(priceSort)

    return res.status(200).send({ status: true, message: "Success", count: data.length, data: data });
  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }
}

//---------------------------------------Get Api(get productDetail by ProductId)---------------------------//

const getProductById = async function (req, res) {
  try {
    let productId = req.params.productId;

    if (!Validator.isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "enter valid productId" });
    }
    let data = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!data) {
      return res.status(404).send({ status: false, message: "No product found by this Product id" });
    }

    res.status(200).send({ status: true, message: "Success", count: data.length, data: data })

  } catch (err) {
    res.status(500).send({ status: false, message: err.message });
  }

};

//-------------------------------Update product-----------------------------//

const updateProductById = async function (req, res) {
  try {

    let productId = req.params.productId

    //validations for productId
    if (!Validator.isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "enter valid productId" });
    }
    if (!await productModel.findOne({ _id: productId, isDeleted: false })) {
      return res.status(404).send({ status: false, message: "Product doesn't exist" })
    }

    let data = req.body
    let files = req.files;

    //validations for body
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "please give some data to update" });
    }

    //validations for title
    if (data.title) {
      if (!isNaN(parseInt(data.title))) {
        return res.status(400).send({ status: false, message: "title should be string" });
      }

      if (await productModel.findOne({ title: data.title })) {
        return res.status(400).send({ status: false, message: "product already exists" })
      }
    }

    //validations for description
    if (data.description) {
      if (!isNaN(parseInt(data.description))) {
        return res.status(400).send({ status: false, message: "description should be string" });
      }
    }

    //validations for price
    if (data.price) {
      if (isNaN(parseInt(data.price))) {
        return res.status(400).send({ status: false, message: "price should be Number" });
      }

      data.price = parseInt(data.price)
    }

    //validations for shipping
    if (data.isFreeShipping) {
      if (["true", "false"].indexOf(data.isFreeShipping) == -1) {
        return res.status(400).send({ status: false, message: "free shipping can only be true or false" });
      }
      if (data.isFreeShipping === "True") {
        data.isFreeShipping = true
      }
      else {
        data.isFreeShipping = false
      }
    }

    //validations for product image
    if (Object.keys(data).indexOf("productImage") != -1) {

      if (Object.keys(data).indexOf("productImage") != -1 && files.length === 0) {
        return res.status(400).send({ status: false, message: "no file to update" });
      }

      if (!Validator.isValidImageType(files[0].mimetype)) {
        return res.status(400).send({ status: false, message: "Only images can be uploaded (jpeg/jpg/png)" });
      }

      //uploading the photo
      let fileUrl = await uploadFile(files[0]);
      data.productImage = fileUrl;
    }

    //validations for style
    if (data.style) {
      if (!isNaN(parseInt(data.style))) {
        return res.status(400).send({ status: false, message: "style should be string" });
      }

      if (typeof data.style == "string" && data.style.trim().length === 0) {
        return res.status(400).send({
          status: false, message: "style can't be empty"
        });
      }
    }

    //validations for size
    if (data.availableSizes) {
      let sizeArr = data.availableSizes.split(",")
      for (let i = 0; i < sizeArr.length; i++) {
        if (["S", "XS", "M", "X", "L", "XXL", "XL"].indexOf(sizeArr[i]) === -1) {
          return res.status(400).send({ status: false, message: "available sizes should be among S,XS,M,X,L,XXL,XL" });
        }
      }
      data.$push = { availableSizes: sizeArr }
      delete data.availableSizes
    }
    //validations for installments
    if (data.installments) {
      if (isNaN(parseInt(data.installments))) {
        return res.status(400).send({ status: false, message: "Installments should be a number" });
      }

      data.installments = parseInt(data.installments)
    }

    let updatedData = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true })
    res.status(200).send({ status: true, message: "Success", data: updatedData })

  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
}


//------------------------------------Delete Api--------------------------------------------//

const deleteProducts = async function (req, res) {
  try {
    let productId = req.params.productId

    if (!Validator.isValidObjectId(productId)) {
      return res.status(400).send({ status: false, message: "enter valid productId" });
    }
    let data = await productModel.findOne({ _id: productId, isDeleted: false })
    if (!data) {
      return res.status(404).send({ status: false, message: "Product already deleted" });
    }
    let deletedData = await productModel.findOneAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: new Date() }, { new: true })
    return res.status(200).send({ status: true, message: "Success", data: deletedData })

  } catch (err) {
    return res.status(500).send({ status: false, error: err.message });
  }
};


module.exports = { createProduct, getProduct, getProductById, updateProductById, deleteProducts }
