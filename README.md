## Requirements

- NPM
- Download and install MongoDB : https://www.mongodb.com/download-center/community

## Start Server

Run MongoDb :

On Windows, execute mongod.exe

Then, start the nodeJS server :

```
$ npm start
```

Server starts on localhost:3000.

Check http://localhost:3000

## API

### GLOBAL

GET /

GET /users/getAll

GET /cards/getAll

### USERS

GET /users/subscribe

GET /users/unsubscribe

GET /users/connect

GET /users/disconnect

GEt /users/amIConnected

### MATCH

GET /match/getMatch

GET /match/getAllMatch

GET /match/initDeck

GET /match/pickCard

GET /match/playCard

GET /match/attack

GET /match/attackPlayer

GET /match/endTurn

GET /match/finishMatch

### MATCHMAKING

GET /matchmaking/participate

GET /matchmaking/unparticipate

GET /matchmaking/getAll

GET /matchmaking/request

GEt /matchmaking/acceptRequest

# How to set up docker for nodejs and mongoDB

https://medium.com/statuscode/dockerising-a-node-js-and-mongodb-app-d22047e2806f
