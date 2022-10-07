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
app.get("/api/users/:_id/logs", async (req, res) => {
    const id = req.params._id;
    const findParams = [
        {
            $match: { _id: new mongoose.Types.ObjectId(id) },
        },
        {
            $project: {
                _id: 1,
                username: 1,
                log: 1,
            },
        },
        {
            $project: {
                count: { $size: "$log" },
                log: {
                    date: 1,
                    duration: 1,
                    description: 1,
                },
            },
        },
    ];
    const { from, to, limit } = req.query;
    if (from || to || limit) {
        let logSearch = 1;
        if (from || to) {
            logSearch = {
                $filter: {
                    input: "$log",
                    as: "item",
                    cond: {},
                },
            };
            const conditions = [];
            if (from) {
                conditions.push({ $gte: ["$$item.date", new Date(from)] });
            }
            if (to) {
                conditions.push({ $lte: ["$$item.date", new Date(to)] });
            }
            if (conditions.length > 1) {
                logSearch.$filter.cond = { $and: conditions };
            } else {
                logSearch.$filter.cond = conditions[0];
            }
        }
        if (limit) {
            findParams[1].$project.log = {
                $slice: [
                    typeof logSearch === "number" ? "$log" : logSearch,
                    Number(limit),
                ],
            };
        } else {
            findParams[1].$project.log = logSearch;
        }
    }
    try {
        const users = await User.aggregate(findParams).exec();
        const user = users[0];
        console.log(user);
        res.json({
            ...user,
            log: user.log.map((item) => ({
                ...item,
                date: item.date.toDateString(),
            })),
        });
    } catch (error) {
        console.log(error);
    }
});

const listener = app.listen(process.env.PORT || 3000, () => {
    console.log("Your app is listening on port " + listener.address().port);
});
