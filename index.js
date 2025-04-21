import express from "express";
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import pkg from 'firebase-admin'; // Import the default export from firebase-admin
const { credential } = pkg; // Destructure credential from the default export
import { readDevicePushTokens } from './firestoreUtils.js';
import { sendNotification } from './sendNotification.js';
import callUser from './utils/callUser.js';

const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8'));

initializeApp({
    credential: credential.cert(serviceAccount)
});

const app = express();
app.use(express.json());

app.post("/send", async function (req, res) {
    console.log('body: ', req.body);
    const token = req.body.fcmToken;
    const data = req.body.data;

    try {
        const result = await sendNotification(token, data);
        res.status(200).json({ success: "Success!!", response: result.response });
    } catch (error) {
        res.status(400).json({ error: "Failed to send notification", details: error.message });
    }
});

app.post('/notify/:deviceToken', async (req, res) => {
    const { deviceToken } = req.params;

    try {
        await callUser(deviceToken, { environment: 'production' }); // Set environment to production
        res.status(200).send({ message: 'Notification sent successfully' });
    } catch (err) {
        const { success, message, error } = err;
        res.status(500).send({ error: `Failed to send notification: ${success}, ${message}, ${error}` });
    }
});

app.get("/devices", async function (req, res) {
    try {
        const devices = await readDevicePushTokens();
        console.log("Devices retrieved:", devices); // Log the retrieved devices
        res.status(200).json(devices);
    } catch (error) {
        console.error("Error fetching devices:", error);
        res.status(500).json({ error: "Failed to fetch devices" });
    }
});

app.listen(3000, function () {
    console.log('App listen on 3000');
});

