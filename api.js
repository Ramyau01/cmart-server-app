const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const cors = require("cors");
const { log } = require("console");
const { ObjectId } = require("mongodb");

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());
// const client = new MongoClient("mongodb://localhost:27017");
//mongodb+srv://ramyakrishnan13:yEXwPAVxPwY8q8zE@cluster0.hwja6.mongodb.net/
const client = new MongoClient(
  "mongodb+srv://ramyakrishnan13:yEXwPAVxPwY8q8zE@cluster0.hwja6.mongodb.net/"
);
let database;
client.connect({ useUnifiedTopology: true }).then((clientObj, err) => {
  if (err) {
    console.error("Failed to connect to the database:", err);
    process.exit(1);
  } else {
    database = clientObj.db("cmartdb");
    console.log("connected to database");
  }
});

//GET /admin
app.get("/admin", (req, res) => {
  database
    .collection("admin")
    .find({})
    .toArray()
    .then((documents, err) => {
      if (err) {
        console.error("Error fetching record:", err);
        return res.status(500).send("Error fetching record"); // Send error response
      }
      console.log(documents);
      res.send(documents);
      res.end();
    });
});

//GET /user/userId
app.get("/user/:userid", (req, res) => {
  database
    .collection("users")
    .find({ userId: parseInt(req.params.userid) })
    .toArray()
    .then((documents, err) => {
      if (err) {
        console.error("Error fetching record:", err);
        return res.status(500).send("Error fetching record"); // Send error response
      }
      console.log(documents);
      res.send(documents);
      res.end();
    });
});

//GET /categories
app.get("/categories", (req, res) => {
  database
    .collection("categories")
    .find({})
    .toArray()
    .then((documents, err) => {
      if (err) {
        console.error("Error fetching the records");
        return res.status(500).send("Error fetching categories record");
      }
      res.send(documents);
      console.log("succesful fetching of  records");
      res.end();
    });
});

//GET /products
app.get("/products", (req, res) => {
  database
    .collection("products")
    .find({})
    .toArray()
    .then((documents, err) => {
      if (err) {
        console.error("Error fetching the records");
        return res.status(500).send("Error fetching categories record");
      }
      res.send(documents);
      console.log("succesful fetching of  records");
      res.end();
    });
});

//admin adds a new category
//POST /new-category
var count = 8;
app.post("/new-category", (req, res) => {
  try {
    let categoryName = req.body.categoryName;
    console.log("New Category ", categoryName);
    if (
      typeof categoryName === "string" &&
      categoryName.trim() !== "" &&
      isNaN(categoryName)
    ) {
      var category = {
        categoryId: count++,
        // categoryId: parseInt(req.body.categoryId),
        categoryName: req.body.categoryName,
      };
      database.collection("categories").insertOne(category);
      console.log("New Category Added");
    } else {
      throw new Error("Category name is not a string");
    }
  } catch (error) {
    return res.status(400).send("Category Name is not a string");
  }

  res.end();
});

//POST /register-user
var count = 0;
function generateUserId() {
  count += 1;
  return count;
}
app.post("/register-user", (req, res) => {
  database.collection("users").insertOne({
    userId: generateUserId(),
    userName: req.body.userName.trim(),
    password: req.body.password,
    mobile: req.body.mobile,
    email: req.body.email,
    address: req.body.address,
    dob: req.body.dob,
  });
  console.log("User Registered");
  res.end();
});

//POST /create-product
app.post("/create-product", (req, res) => {
  database.collection("products").insertOne({
    title: req.body.title,
    price: parseInt(req.body.price),
    description: req.body.description,
    category: req.body.category,
    image: req.body.image,
    rating: {
      rate: parseInt(req.body.rate),
      count: parseInt(req.body.count),
    },
  });
  console.log("Product added");
  res.end();
});

//POST /create-cart
app.post("/create-cart", async (req, res) => {
  try {
    const productId = req.body.productId;
    const userId = req.body.userId;

    if (!ObjectId.isValid(productId) || !ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ message: "Invalid product or customer ID format" });
    }

    const cartItem = {
      userId: new ObjectId(userId),
      productId: new ObjectId(productId),
      quantity: parseInt(req.body.quantity),
      price: parseFloat(req.body.price),
      total: parseFloat(req.body.total),
    };
    const result = await database.collection("cart").insertOne(cartItem);
    console.log("Product added to cart");

    res.status(201).json({
      message: "Product added to cart",
      cartId: result.insertedId,
    });
    res.end();
  } catch (e) {
    console.error("Error adding product to cart:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//PUT /update-profile/:userId
app.put("/update-profile/:userId", async (req, res) => {
  var update = {
    userName: req.body.userName,
    password: req.body.password,
    mobile: req.body.mobile,
    email: req.body.email,
    address: req.body.address,
    dob: req.body.dob,
  };
  try {
    const result = await database
      .collection("users")
      .updateOne({ userId: parseInt(req.params.userId) }, { $set: update });
    if (result.matchedCount === 0) {
      return res.status(400).send("User not found");
    }
    res.send("User profile updated successfully");
  } catch (err) {
    console.error("Error updating user profile:", err);
    res.status(500).send("Error updating profile");
  }
});

//PUT /update-product/:id
app.put("/update-product/:id", async (req, res) => {
  const productId = req.params.id;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID format" });
  }
  const updatedProduct = {
    title: req.body.title,
    price: req.body.price,
    description: req.body.description,
    category: req.body.category,
    image: req.body.image,
    rating: {
      rate: req.body.rate,
      count: req.body.count,
    },
  };

  try {
    const result = await database
      .collection("products")
      .updateOne({ _id: new ObjectId(productId) }, { $set: updatedProduct });

    if (!result.matchedCount) {
      return res.status(404).json({ message: "Product not found" });
    } else {
      console.log("product updated");
      res.end();
    }
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE	/delete-product/1		Removes specified product
app.delete("/delete-product/:id", (req, res) => {
  const productId = req.params.id;

  if (!ObjectId.isValid(productId)) {
    return res.status(400).json({ message: "Invalid product ID format" });
  }
  client.connect().then((clientObj) => {
    try {
      database
        .collection("products")
        .deleteOne({ _id: new ObjectId(productId) })
        .then(() => {
          console.log("product deleted");
          res.end();
        });
    } catch (e) {
      res.status(400).json({ message: e });
    }
  });
});

module.exports = app;
// app.listen(8090);
