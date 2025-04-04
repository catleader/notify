import express from "express";
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getMessaging } from "firebase-admin/messaging";
import { v4 as uuidv4 } from 'uuid';

initializeApp({
    credential: applicationDefault(),
});

const app = express();
app.use(express.json())


app.post("/send", function (req, res) {
    const token = req.body.fcmToken;
    console.log('token:', token)
    const data = req.body.data;
    const uuid = uuidv4();
    console.log('uuid:', uuid);

    // Add uuid to the data payload
    const updatedData = {
        ...data,
        uuid: uuid,
    };

    const message = {
        // notification: {
        //     title: "Test message",
        //     body: "Greeting from FCM server",
        // },
        data: updatedData, // Use the updated data with uuid
        android: {
            priority: 'high',
            // notification: {
            //     channelId: 'channelnormal',
            //     defaultSound: false,
            // },
        },
        // apns: {
        //     payload: {
        //         aps: {
        //             sound: 'notification.wav'
        //         },
        //     },
        // },
        token: token,
    };

    getMessaging().send(message)
        .then((response) => {
            res.status(200).json({
                success: "Success!!"
            });
            console.log("Success sending FCM message");
        })
        .catch((error) => {
            res.status(400);
            res.send(error);
            console.log("Failed on sending FCM", error);
        });
});

app.listen(3000, function () {
    console.log('App listen on 3000');
});

