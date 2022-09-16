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

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    log: [
        {
            description: { type: String, required: true },
            duration: { type: Number, required: true },
            date: { type: Date, default: Date.now },
        },
    ],
});

const User = mongoose.model("User", userSchema);

const urlEncodedParser = bodyParser.urlencoded({ extended: false });

app.use(cors());
app.use(express.static("public"));
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/views/index.html");
});
app.get("/api/users", async (req, res) => {
    const users = await User.find({}, "username _id").exec();
    res.json(users);
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
app.post("/api/users/:_id/exercises", urlEncodedParser, async (req, res) => {
    const exercise = {
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? req.body.date : undefined,
    };
    const saveExercise = async () => {
        try {
            const user = await User.findById(req.params._id).exec();
            user.log.push(exercise);
            const lastExercise = user.log[user.log.length - 1];
            await user.save();
            res.json({
                _id: user._id,
                username: user.username,
                description: lastExercise.description,
                duration: lastExercise.duration,
                date: lastExercise.date.toDateString(),
            });
        } catch (error) {
            console.log(error);
        }
    };
    await saveExercise();
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
