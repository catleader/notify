import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import http2 from 'http2';

/**
 * Send a VoIP push notification to an iOS device using HTTP/2
 * @param {string} deviceToken - The device token to send the notification to
 * @param {Object} options - Configuration options
 * @param {string} options.certPath - Path to the VOIP certificate file
 * @param {string} options.passphrase - Certificate passphrase
 * @param {string} options.bundleId - App bundle ID (e.g., 'com.pdkm.locpoc.voip')
 * @param {string} options.environment - 'development' or 'production'
 * @param {string} options.callerName - Name of the caller
 * @param {string} options.handle - Phone number or identifier
 * @param {boolean} options.isVideo - Whether this is a video call
 * @returns {Promise<Object>} - Response from Apple Push Notification Service
 */
export default function callUser(deviceToken, voipCert, options = {}) {
    // Default options
    const {
        passphrase = '1234xx',
        bundleId = 'com.pdkm.locpoc.voip',
        environment = 'development',
        callerName = 'Daywork Support',
        handle = '0123456789',
        isVideo = true,
        alertMessage = 'Hello From Daywork'
    } = options;

    // Validate device token
    if (!deviceToken || typeof deviceToken !== 'string') {
        return Promise.reject(new Error('Invalid device token'));
    }

    // Determine API URL based on environment
    const baseUrl = environment === 'production'
        ? 'https://api.push.apple.com'
        : 'https://api.development.push.apple.com';

    console.log(`Using base URL: ${baseUrl}`);

    // Prepare the notification payload
    const payload = {
        aps: {
            alert: alertMessage,
        },
        id: uuidv4(),
        nameCaller: callerName,
        handle: handle,
        isVideo: isVideo,
    };

    const data = JSON.stringify(payload);

    // Certificate options
    const clientOptions = {
        cert: voipCert,
        key: voipCert,
        passphrase: passphrase
    };

    // Return a promise for simpler async handling
    return new Promise((resolve, reject) => {
        try {
            // Create an HTTP/2 client
            const client = http2.connect(baseUrl, clientOptions);
            
            client.on('error', (err) => {
                client.close();
                reject({
                    success: false,
                    message: 'Connection error',
                    error: err.message
                });
            });

            // Set up the request
            const req = client.request({
                ':method': 'POST',
                ':path': `/3/device/${deviceToken}`,
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(data),
                'apns-topic': bundleId,
                'apns-push-type': 'voip',
                'apns-id': uuidv4()
            });

            // Handle response
            req.on('response', (headers) => {
                const statusCode = headers[':status'];
                
                req.on('end', () => {
                    client.close();
                    
                    if (statusCode >= 200 && statusCode < 300) {
                        resolve({
                            success: true,
                            statusCode,
                            message: 'Push notification sent successfully'
                        });
                    } else {
                        reject({
                            success: false,
                            statusCode,
                            message: `Request failed with status code ${statusCode}`
                        });
                    }
                });
            });

            req.on('error', (err) => {
                client.close();
                reject({
                    success: false,
                    message: 'Request error',
                    error: err.message
                });
            });

            // Send the data
            req.write(data);
            req.end();
            
        } catch (error) {
            reject({
                success: false,
                message: 'Error sending push notification',
                error: error.message
            });
        }
    });
}

// Example usage:
// callUser('your-device-token')
//     .then(response => console.log('Success:', response))
//     .catch(error => console.error('Error:', error));