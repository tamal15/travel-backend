const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

// middleware
app.use(
  cors({
    origin: ["https://privet-router-autentication.web.app"],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(cookieParser());

const uri = "mongodb+srv://travel:ErWP2UyoCkK0OohE@cluster0.ev8on.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});



//! Verify Token Middleware
const verifyToken = async (req, res, next) => {
  const token = req?.cookies?.FOA_Token;
  if (!token) {
    console.log("Where is token?");
    return res.status(401).send({ success: false, message: "Unauthorized" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    req.data = decoded;
    next();
  });
};

async function run() {
  try {
    const addpostCollection = client.db("travel").collection("postdata");
  
   
   
  

    //! JWT Section

    app.get("/testtest", verifyToken, async (req, res) => {
      console.log(">>>>>", req.cookies);
      res.send({ success: true, data: "travel" });
    });
    //! Verify Admin
    const verifyAdmin = async (req, res, next) => {
      const adminEmail = req.data.email;
      const user = await usersCollection.findOne({ email: adminEmail });
      const isAdmin = user?.role === "admin";
      if (!isAdmin) {
        return res.status(403).send({ message: "Not Admin" });
      }
      next();
    };

    //! Token Generator
    app.post("/create-jwt-token", async (req, res) => {
      const user = await req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res
        .cookie("travel", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
        })
        .send({ success: true, token });
    });

    //!Token Remove
    app.post("/remove-jwt-token", async (req, res) => {
      res.clearCookie("travel", { maxAge: 0 }).send({ success: true });
    });


    app.post('/postProduct', async(req,res) =>{
      const user=req.body;
    console.log(user)
      // console.log(like)
      const result=await addpostCollection.insertOne(user);
      res.json(result)
  });

   // get product
   app.get("/getproduct", async (req, res) => {
    const result = await addpostCollection.find({}).toArray();
    res.json(result);
  });

      // update
      app.get("/editproduct/:id", async (req, res) => {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const user = await addpostCollection.findOne(query);
        res.json(user);
      });

  app.put("/productupdate/:id", async (req, res) => {
    const id = req.params.id;
    const updateUser = req.body;
    console.log(updateUser);
    const filter = { _id: new ObjectId(id) };
    const options = { upsert: true };

    const updateDoc = {
      $set: {
        name: updateUser.name,
        title: updateUser.title,
        description: updateUser.description,
      },
    };
    const result = await addpostCollection.updateOne(filter, updateDoc, options);
    console.log("uodateinf", id);
    res.json(result);
  });

   // delete
   app.delete("/productDelete/:id", async (req, res) => {
    const result = await addpostCollection.deleteOne({
      _id: new ObjectId(req.params.id),
    });
    res.json(result);
  });



    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("All server is running");
});

app.listen(port, () => {
  console.log("server is running on port", port);
});
