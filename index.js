import express from "express";
import cors from "cors"; // Import the cors middleware
import { initializeApp } from 'firebase-admin/app';
import pkg from 'firebase-admin';
const { credential } = pkg;
import { readDevicePushTokens } from './firestoreUtils.js';
import { sendNotification } from './sendNotification.js';
import callUser from './utils/callUser.js';

const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf-8'));
const voipCert = Buffer.from(process.env.VOIP_ENCODED_CERT, 'base64');
const port = process.env.PORT || 8080;
const ENVIRONMENT = process.env.APP_ENVIRONMENT || 'development';

initializeApp({
    credential: credential.cert(serviceAccount)
});

const app = express();

// Configure CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Allowed origins
        const allowedOrigins = ['https://fir-web-calling.web.app'];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow localhost connections for development
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
            return callback(null, true);
        }

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST'],
    credentials: true,
    optionsSuccessStatus: 200
};

// Apply CORS middleware with the options
app.use(cors(corsOptions));

app.use(express.json());

// Rest of your routes remain the same
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
        const devices = await readDevicePushTokens();
        const targetDevice = devices.find(device => device.pushToken === deviceToken);

        if (!targetDevice) {
            return res.status(404).json({ error: 'Device not found' });
        }

        const deviceNameLower = targetDevice.deviceName.toLowerCase();
        if (deviceNameLower.includes('android')) {
            await sendNotification(targetDevice.pushToken);
        } else if(deviceNameLower.includes('ios')) {
            await callUser(targetDevice.pushToken, voipCert, { environment: ENVIRONMENT });
        } else {
            return res.status(400).json({ error: 'Unsupported device type' });
        }

        res.status(200).send({ message: 'Notification sent successfully' });
    } catch (err) {
        const { success, message, error } = err;
        res.status(500).send({ error: `Failed to send notification: ${success}, ${message}, ${error}` });
    }
});

app.get("/devices", async function (req, res) {
    try {
        const devices = await readDevicePushTokens();
        console.log("Devices retrieved:", devices);
        res.status(200).json(devices);
    } catch (error) {
        console.error("Error fetching devices:", error);
        res.status(500).json({ error: "Failed to fetch devices" });
    }
});

app.listen(port, function () {
    console.log(`App listen on ${port} in ${ENVIRONMENT} mode`);
});