const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const exerciseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    log: [exerciseSchema],
});

const User = mongoose.model("User", userSchema);

const urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});
app.post("/api/users", urlEncodedParser, async (req, res) => {
    const username = req.body.username;
    const saveUser = async () => {
        try {
            const user = new User({ username });
            const savedUser = await user.save();
            res.json({
                _id: savedUser._id,
                username: savedUser.username,
            });
        } catch (error) {
            console.log(error);
        }
    };
    await saveUser();
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
