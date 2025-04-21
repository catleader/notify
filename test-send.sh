curl -v \
-d '{"aps":{"alert":"Hello From Daywork"},
"id":<uuidv4>,
"nameCaller":"Daywork Support",
"handle":"0123456789",
"isVideo":true}' \
-H "apns-topic: com.pdkm.locpoc.voip" \
-H "apns-push-type: voip" \
--http2 \
--cert VOIP.pem:'1234xx' \
https://api.development.push.apple.com/3/device/<deviceToken>