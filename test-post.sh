curl -X POST http://localhost:3000/write \
-H "Content-Type: application/json" \
-d '{
    "collectionName": "testCollection",
    "documentId": "testDoc",
    "text": "Hello, Firestore!"
}'


