import { getMessaging } from "firebase-admin/messaging";
import { v4 as uuidv4 } from 'uuid';

export async function sendNotification(fcmToken, data) {
    const uuid = uuidv4();
    console.log('uuid:', uuid);

    // Add uuid to the data payload
    const updatedData = {
        ...data,
        uuid: uuid,
    };

    const message = {
        notification: {
            title: "Test message",
            body: "Greeting from FCM server",
        },
        data: updatedData,
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
        //
        //         },
        //     },
        // },
        token: fcmToken,
    };

    try {
        const response = await getMessaging().send(message);
        console.log("Success sending FCM message");
        return { success: true, response };
    } catch (error) {
        console.error("Failed on sending FCM", error);
        throw error;
    }
}