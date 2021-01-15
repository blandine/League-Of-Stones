## Requirements

- NPM
- Download and install MongoDB : https://www.mongodb.com/download-center/community

## Start Server

Run MongoDb :

On Windows, execute mongod.exe

Then, install the npm packages and start the nodeJS server :

```
$ npm ci
$ npm start
```

Server starts on localhost:3001.

Check http://localhost:3001

## API

### GLOBAL  
  
GET /  
Check if API is up

GET /users/getAll  
Return all suscribed users

GET /cards  
Return all cards

### USERS

PUT /user    
Create a new user with email, name and password

GET /users/unsubscribe  
Unsubscribe a connected user with email and password

POST /login  
Connect a user with email and password

POST /logout   
Disconnect a connected user. Requires a header with a www-authenticate token

GET /users/amIConnected  
Returns email and name of the connected user

### MATCH

GET /match/getMatch  
Return all data about a match

GET /match/getAllMatch  
Return current status of all the matches

GET /match/initDeck  
Send the player deck to the server. Requires a parameter deck with the cards array.

GET /match/pickCard  
Return a new card from the deck

GET /match/playCard  
Play a card

GET /match/attack 
Use a card to attack a ennemy champion. Requires card and ennemyCard

GET /match/attackPlayer  
Use a card to attck the ennemy player

GET /match/endTurn  
End a player turn

GET /match/finishMatch
End match

### MATCHMAKING

GET /matchmaking/participate  
Add user to the waiting list

GET /matchmaking/unparticipate  

GET /matchmaking/getAll  
Return all users on the waiting list with their matchmakingId

GET /matchmaking/request  
Send a match request to a user on the waiting list. Requires the matchmakingId

GET /matchmaking/acceptRequest  
Accept a match request. Requires the matchmakingId of the user who did the request.

# How to set up docker for nodejs and mongoDB

https://medium.com/statuscode/dockerising-a-node-js-and-mongodb-app-d22047e2806f
