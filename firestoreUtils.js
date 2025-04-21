import { getFirestore } from 'firebase-admin/firestore';

export async function readDevicePushTokens() {
    const db = getFirestore();
    const rootCollectionRef = db.collection('calling-system');
    const result = [];

    try {
        const rootSnapshot = await rootCollectionRef.listDocuments();
        console.log(`Root collection size: ${rootSnapshot.length}`); // Log the size of the root collection

        let index = 1; // Initialize a counter for numbering devices
        for (const deviceRef of rootSnapshot) {
            const deviceName = deviceRef.id; // Get the device name
            console.log(`Processing device: ${deviceName}`); // Log the device name
            const deviceDoc = await deviceRef.get(); // Get the document data
            if (deviceDoc.exists) {
                result.push({
                    id : index++, // Add a number to each device object
                    deviceName, // Include the device name
                    ...deviceDoc.data() // Include all fields in the document
                });
            } else {
                console.log(`Document for device ${deviceName} does not exist.`);
            }
        }

        console.log("Documents retrieved for all devices.");
        return result;
    } catch (error) {
        console.error("Error reading from Firestore:", error);
        throw error;
    }
}