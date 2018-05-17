# Timesync-Client
Javascript Client for the Ambassadors proprietary **Timesync Server**.

---

- [TIMESYNC.Client](#client)
  * [Messages](#client.messages)
  * [Properties](#client.properties)
  * [Methods](#client.methods)
  * [Events](#client.events)  


- [TIMESYNC.Message](#message)
  * [Methods](#message.methods)  


- [TIMESYNC.util](#util)
  * [Methods](#util.methods)  

---

## <a name="client"></a>TIMESYNC.Client ##

The **Timesync Client** is used to establish a websocket connection to the **Timesync Server**, which in turn initiates a series of ping requests to establish the time offset between the server and the client, regardless of network delay or instability. Once the server has reached confidence it has established the offset, it will notify the client and send it the time offset in milliseconds.  

A development server is running on the following address:
```
wss://nl020.cube-cloud.com/timesync
```

The Client and Server communicate with each other by sending Messages over the websocket connection. In general, Messages contain a unique id, a timestamp that gets set when dispatched, a message type and message body. The type is used to trigger specific behavior on either end and the body contains any type of JSON serializable content. The Client can either register message handlers to act on incoming messages, or attach a callback and scope to outgoing messages.

Apart from establishing an accurate sync, the server exposes several other features. It incorporates 'rooms' which can be created or joined. Rooms can also store arbitrary properties. This is great when you want to save application state onto the room, which then can be accessed by other clients when they join the room. State changes are always broadcasted to all users in the same room.

The Server will act on a specific set of Message types as described below, but will broadcast any 'unknown' messages to all users of the same room. This is great to instantly push application state from any user to all other users. Think of a play / pause event, or game start event etc.

### Getting Started:

For a full working example check /example/index.html.
```javascript
var tsClient = new TIMESYNC.Client({debug: true}),
    clockOffset,
    stats;

// INIT EVENT LISTENERS

tsClient.on("connected", function (e) {
    console.log("Connection Established", e);

    // register a message handler
    tsClient.registerHandler("echo", function (msg) {
        console.log("echo message received", msg);
    });

    // send an echo text message
    tsClient.newMsg("echo", {test: "testing connection"}).send();

    // join a room
    tsClient.newMsg("join_room", {room: "dev_room"}).send();
});

tsClient.on("syncestablished", function (e) {
    clockOffset = tsClient.getClockOffset();
    stats = tsClient.getStats();
    console.log("Sync Established", clockOffset, stats, e);
});

tsClient.on("syncprogress", function (e) {
    console.log("syncing", Math.min(100, Math.round(e.details * 100));
});

// ESTABLISH A SERVER CONNECTION

tsClient.connect("wss://nl020.cube-cloud.com/timesync");

```


Currently the TimeSync Server uses the following reserved Message types for client / server communication:

### <a name="client.messages"></a>Messages:

- [claim_room](#server.claim_room)
- [clockOffset](#server.clock_offset) _(private, receive only)_
- [create_room](#server.create_room)
- [echo](#server.echo)
- [get_rooms](#server.get_rooms)
- [get_room_properties](#server.get_room_properties)
- [get_room_config](#server.get_room_config)
- [get_users](#server.get_users)
- [join_room](#server.join_room)
- [leave_room](#server.leave_room)
- [ping](#server.ping) _(private)_
- [pong](#server.pong) _(private)_
- [request_time_offset](#server.request_time_offset)
- [room_properties_changed](#server.room_properties_changed) _(private)_
- [set_room_properties](#server.set_room_properties)
- [set_room_config](#server.set_room_config)
- [user_count](#server.user_count) _(private)_
- [user_joined](#server.user_joined) _(private)_
- [user_left](#server.user_left) _(private)_

---
<a name="server.claim_room"></a>type: **claim_room** : Object  
Request to regain ownership of a room. This method requires the room private token that was previously issued by [create_room](#server.create_room). This method can be usefull in the case of a dropped connection on the side of the original owner. If no room is supplied, the server will assume we want to claim the currenlty joined room.

Note: owning a room allows a client to update the room configuration. See [set_room_config](#server.set_room_config) for more information.

Arguments: 
- room : String (optional)
- token : String

Response:
- success : Boolean
- room : String

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("claim_room", {room: 'test', token: 'privatetoken'}, function (msg) { console.log(msg.success, msg.room); }).send();
```

---
<a name="server.clock_offset"></a>type: **clock_offset** : Integer _(private, receive only)_  
Server dispatched message with the established time offset in milliseconds.  

Response:
- offset : Integer

---
<a name="server.create_room"></a>type: **create_room** (room, token) : String  
Creates a new room on the server and joins it as an owner.  

A room owner is able to set specific room configurations like the maximum amount of users, or wether the room should be listed in the [get_rooms](#server.get_rooms) command by making it hidden or not. See [set_room_config](#server.set_room_config) for more details. 

If no `room` is supplied in the body, the room id will be generated by the server to ensure that it is unique.  

If no `token` is supplied in the body, the server will generate a token which can be used to regain ownership of the room in the case of a lost connection by calling [claim_room](#server.claim_room) and passing the name of the room and the token in the body.  

Additional room config parameters can be passed as well. See [set_room_config](#server.set_room_config) for more information.

Use a callback or register a 'create_room' message handler before dispatching the message.

Arguments:
- room : String (optional)  
- token : String (optional)
- broadcast : Boolean (optional)
- hidden : Boolean (optional)
- maxUsers : Int (optional)
- locked : Boolean (optional)

Response:
- room : String, the room ID
- token : String, the room private token

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("create_room", {room: 'test', token: 'baddpassword'}, function (msg) { console.log(msg.room); }).send();
```

---
<a name="server.echo"></a>type: **echo** (...) : Anything JSON serializable  
The echo message is a simple debug message type intended for testing server / client response. The server will simply bounce the message back to the client.
```javascript
var tsClient = new TIMESYNC.Client({debug: true});
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("echo", {test: "this is a test message"}).send();
```

---
<a name="server.get_rooms"></a>type: **get_rooms** : Array  
Requests a list of all available rooms. Use a callback or register a 'get_rooms' message handler before dispatching the message.

Response:
- rooms : Array  

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("get_rooms", {}, function (msg) { console.log(msg.rooms); }).send();
```

---
<a name="server.get_room_properties"></a>type: **get_room_properties** : Object  
Requests the properties of the current room. Use a callback or register a 'get_room_properties' message handler before dispatching the message.  
Note: the room properties are also included in the server response after successfully joining a room.

Response:
- properties : Object  

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("get_room_properties", {}, function (msg) { console.log(msg.properties); }).send();
```

---
<a name="server.get_room_config"></a>type: **get_room_config** : Object  
Requests the room configuration of the current room. Use a callback or register a 'get_room_config' message handler before dispatching the message.  
Note: the room configuration is defined by the room owner. See [set_room_config](#server.set_room_config) for more details.

Response:
- broadcast: Boolean, custom type messages will be broadcasted to all users.
- hidden: Boolean, hidden rooms will not be listed by the [get_rooms](#server.get_rooms) request.
- maxUsers: Int, the maximum amount of users that can join this room.
- locked: Boolean, locked rooms won't except any [join_room](#server.join_room) requests.

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("get_room_config", {}, function (msg) { console.log(msg); }).send();
```

---
<a name="server.join_room"></a>type: **join_room** (room) : Boolean, String, Object  
Requests to join a specific room. The server will return an error if the room does not exist. Use [get_rooms](#server.get_rooms) to choose an existing room or [create_room](#server.create_room) to make your own. Use a callback or register a 'join_room' message handler before dispatching the message. 

Arguments:
- room : String, the room ID

Response:
- success : Boolean
- room : String
- properties : Object  

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("join_room", {room: "test"}, function (msg) { console.log(msg); }).send();
```

---
<a name="server.leave_room"></a>type: **leave_room** : Boolean  
Requests to leave the current room. Use a callback or register a 'leave_room' message handler before dispatching the message.

Response:
- success : Boolean  

```javascript
var tsClient = new TIMESYNC.Client({debug: true});
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("leave_room").send();
```
---
<a name="server.ping"></a>type: **ping** _(private)_  
Internal message type used for sync establishment, initiated by the Server.

---
<a name="server.pong"></a>type: **pong** _(private)_  
Internal message type used for sync establishment, responded by the Client.

---
<a name="server.request_time_offset"></a>type: **request_time_offset**    
Request the server to initiate the sync process and estimate a time offset. This will initiate a series of ping request from the server to the client to estimate the clock offset. Once the estimation has been established the server will send a 'clockOffset' message and the client will fire a `syncestablished` event.

Note: if the 'autoInitSync' config property is set to true (default) and a time offset has not previously been established, a time offset request will automatically be made on a successful server connection.

```javascript
var tsClient = new TIMESYNC.Client();
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("request_time_offset").send();
```
---
<a name="server.room_properties_changed"></a>type: **room_properties_changed** : Object _(private, receive only)_  
A Server initiated message to indicate that some or all room properties have changed. Register a 'room_properties_changed' handler to catch this message.
Response:
- properties : Object

---
<a name="server.set_room_properties"></a>type: **set_room_properties** (properties) : Boolean  
Request the server to store or update the given properties onto the room.

```javascript
var tsClient = new TIMESYNC.Client({debug: true});
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("set_room_properties", {level: 1}).send();
```

---
<a name="server.set_room_config"></a>type: **set_room_config** (config) : Boolean  
Request the server to update the given room configuration. Currently the following configuration options are supported:

- broadcast: Boolean, custom type messages will be broadcasted to all users. Defaults to `true`.
- hidden: Boolean, hidden rooms will not be listed by the [get_rooms](#server.get_rooms) request. Defaults to `false`.
- maxUsers: Int, the maximum amount of users that can join this room. Defaults to `0` (unlimited).
- locked: Boolean, locked rooms won't except any [join_room](#server.join_room) requests. Defaults to `false`.

Note: only room owners can update the room configuration. Use [claim_room](#server.claim_room) to regain ownership of a room in the case of a lost server connection.

```javascript
var tsClient = new TIMESYNC.Client({debug: true});
tsClient.connect("wss://nl020.cube-cloud.com/timesync");
tsClient.newMsg("set_room_properties", {level: 1}).send();
```

---
<a name="server.user_count"></a>type: **user_count** : Integer _(private, receive only)_  
A Server initiated message to notify the current user count. This gets triggered every time a user joins or leaves the room. Register a 'user_count' handler to catch this message.

Response:
- count : Integer

---
<a name="server.user_joined"></a>type: **user_joined** : String _(private, receive only)_  
A Server initiated message to notify that a user has joined the room. Register a 'user_joined' handler to catch this message.  
Note: this is currently only dispatched to room owners.  

Response:
- user : String

---
<a name="server.user_left"></a>type: **user_left** : String _(private, receive only)_  
A Server initiated message to notify that a user has left the room. Register a 'user_left' handler to catch this message.  
Note: this is currently only dispatched to room owners.  

Response:
- user : String

---
### <a name="client.properties"></a>Properties:
- debug : Boolean, enable debug messages.
- server : String, the server address to connect to.
- autoReconnect : boolean (optional), automatically reconnect when the server connection is dropped, defaults to true.
- autoInitSync : boolean (optional), automatically initiate a sync request to the server on a successful connection, defaults to true.

---
### <a name="client.methods"></a>Methods:

- [addListener](#client.addlistener)
- [clock](#client.clock)
- [connect](#client.connect)
- [disconnect](#client.disconnect)
- [fireEvent](#client.fireevent)
- [getClockOffset](#client.getclockoffset)
- [getConnected](#client.getconnected)
- [getConnection](#client.getconnection)
- [getId](#client.getid)
- [getSyncProgress](#client.getsyncprogress)
- [getStats](#client.getStats)
- [initSync](#client.initsync)
- [isSync](#client.issync)
- [log](#client.log)
- [newMsg](#client.newmsg)
- [now](#client.now)
- [registerHandler](#client.registerhandler)
- [removeListener](#client.removelistener)
- [send](#client.send)

---
<a name="client.addlistener"></a>**addListener** (type, listener) : Client  
Adds an event listener to the client. For a list of events take a look at the [Events](#client.events) section.

Parameters:
- type : String
- listener : Function

Returns:
- Client

---
<a name="client.clock"></a>**clock** ( ) : Integer  
Returns the offset corrected current time. If the offset has not been established a warning will be printed in the logs.

Returns:
- Integer

---
<a name="client.connect"></a>**connect** (server) : Websocket Connection  
Initiates a connection to the server. If no server parameter is provided it will grab it from the initial client config.

Parameters:
- server : String (optional)

Returns:
- Websocket Connection

---
<a name="client.disconnect"></a>**disconnect** ( )  
Closes the server connection.

---
<a name="client.fireevent"></a>**fireEvent** (event, details) : Client  
Method to fire an event. Any prior registered event listeners will be executed.

Parameters:
- event : String
- details : Anything

Returns:
- Client

---
<a name="client.getclockoffset"></a>**getClockOffset** ( ) : Integer  
Returns the time offset as estimated by the server

Returns:
- Integer

---
<a name="client.getconnected"></a>**getConnected** ( ) : Boolean  
Method to return the connection state. Returns true if connected, false if not.

Returns:
- Boolean

---
<a name="client.getconnection"></a>**getConnection** ( ) : Websocket Connection  
Method to return the current websocket connection.

Returns:
- Websocket Connection

---
<a name="client.getid"></a>**getId** ( ) : UUID  
Method to return the ID of the Client instance.

Returns:
- String

---
<a name="client.getsyncprogress"></a>**getSyncProgress** ( ) : Float  
Method to return the current time syncing progress. Note: alternatively one could use the 'syncprogress' event to receive regular updates on the sync progress.

Returns:
- Float

---

<a name="client.getStats"></a>**getStats** ( ) : Object  
Method to return a stats object holding general sync statistics.

Returns:
- Object

---
<a name="client.initsync"></a>**initSync** ( )  
Method to initiate the sync process between the server and the client.

Note: if the 'autoInitSync' config property is set to true (default) and a time offset has not previously been established, a time offset request will automatically be made on a successful server connection.

---
<a name="client.issync"></a>**isSync** ( ) : Boolean  
Method to return the sync state. Returns true if a sync has been established, false if not.

Returns:
- Boolean

---
<a name="client.log"></a>**log** (arguments)  
Convenience method to log console messages that will be honor the debug state as defined in the Client config.

---
<a name="client.newmsg"></a>**newMsg** (type, body, callback, scope) : Message  
Convenience method to create a new message object and automatically bind it to the client. Optionally it allows for attaching a callback method and scope.

```javascript
tsClient = new TIMESYNC.Client();
tsClient.connect("timesync.nl020.cube-cloud.com", 80);

tsClient.newMsg('join_room',
  {roomId: 'test'},
  function(result) {
    console.debug(result);
  },
  this
).send()
```

Parameters:

- type : String
- body : Anything JSON serializable
- callback : Function (optional)
- scope : this reference (optional)

Returns:
 - Message object

---
<a name="client.now"></a>**now** ( ) : Integer  
Convenience method to get the current time in milliseconds without offset. Note: use clock() to get the current time with offset correction.

Returns:
- Integer

---
<a name="client.registerhandler"></a>**registerHandler** (type, handler) : Client  
Method to register Message handlers. For a full list of supported Messages please see the [Messages](#client.messages) section.

Parameters:
- type : String
- handler : Function

Returns:
- Client

---
<a name="client.removelistener"></a>**removeListener** (type, listener)  
Removes a previously registered event listener. For a list of events take a look at the [Events](#client.events) section.

Parameters:
- type : String
- listener : Function

---
<a name="client.send"></a>**send** (msg)  
Method to send a Message to the server. The 'msg' can be supplied as an instantiated Message object, a config object or JSON formatted string.

Parameters:
- msg : Message / Object / JSON

---
### <a name="client.events"></a>Events:

- [connected](#events.connected)
- [connectionerror](#events.connectionerror)
- [disconnected](#events.disconnected)
- [syncestablished](#events.syncestablished)
- [syncprogress](#events.syncprogress)
- [usercount](#events.usercount)

<a name="events.connected"></a>**connected** ( )  
Fires when the client has successfully initiated a server connection.

---

<a name="events.connectionerror"></a>**connectionerror** (e)  
Fires when the client has successfully initiated a server connection.

Parameters:
- e : Error

---
<a name="events.disconnected"></a>**disconnected** (e)  
Fires when the client has been disconnected from the server.

---
<a name="events.syncestablished"></a>**syncestablished** (offset)  
Fires when the client and server have successfully estimated the time offset.

Parameters:
- offset : Integer

---
<a name="events.syncprogress"></a>**syncprogress** (progress)  
Fires when the sync progress changes.

Parameters:
- progress : Float

---
<a name="events.usercount"></a>**usercount** (count)  
Fires when the user count changes. This happens when people join or leave the room.

Parameters:
- count : Integer

---
## <a name="message"></a>TIMESYNC.Message ##

Message protocol inspired by 0MQ. Each Message instance contains a unique identifier and is structured with a head and body as follows:
```
  Message {
    id: uuid4 (String),
    head: {
      type: message type (String),
      ts: timestamp (Integer),
      clientId: uuid (String)
    },
    body: {
      ...
    }
  }
```
### <a name="message.methods"></a>Methods:

- [bind](#message.bind)
- [getBody](#message.getbody)
- [getClient](#message.getclient)
- [getTS](#message.getts)
- [getType](#message.gettype)
- [send](#message.send)
- [setBody](#message.setbody)
- [setTs](#message.setts)
- [setType](#message.settype)
- [validate](#message.validate)

---
<a name="message.bind"></a>**bind** (client) : Message  
Method to bind the message to the client. This is needed so it can be sent to the server thru the client.

Parameters:
- client (Client)

Returns:
- Message

---
<a name="message.getbody"></a>**getBody** ( ) : Anything JSON serializable  
Convenience method to get the body contents of a message object.

---
<a name="message.getclient"></a>**getClient** ( ) : Client  
Method to get the client of this message, if it has been bound before.

Returns:
- Client

---
<a name="message.getts"></a>**getTs** ( ) : Integer  
Convenience method to get the message timestamp.

Returns:
- Integer

---
<a name="message.gettype"></a>**getType** ( ) : String  
Convenience method to get the type of a message object.

Returns:
- String

---
<a name="message.send"></a>**send** ( ) : Message  
Method to send the message to the server. Note: the message needs to be bound to the client with the 'bind' method first.

Returns:
- Message

---
<a name="message.setbody"></a>**setBody** (body) : Message  
Convenience method to directly set the body contents of a message object.

Parameters:
- body (Anything JSON serializable)

Returns:
- Message

---
<a name="message.setts"></a>**setTs** (timestamp) : Message  
Convenience method to set the dispatch timestamp of a message. The timestamp lives in the message head. This rarely needs to bet set directly though, as it is set as soon as the message is sent to the server, which is what you normally would want.

Parameters:
- timestamp (Integer)

Returns:
- Message

---
<a name="message.settype"></a>**setType** (type) : Message  
Convenience method to set the type of the message object.

Parameters:
- type (String)

Returns:
- Message

---
<a name="message.validate"></a>**validate** ( ) : Message  
A validation method to make sure the message is properly formatted. It will throw up errors when it encounters problems, but always returns the Message object so it can be used in concatenation.

Returns:
- Message

---


## <a name="util"></a>TIMESYNC.util ##

General utility methods.

### <a name="util.methods"></a>Methods:

- [capitaliseString](#util.capitalisestring)
- [formatTime](#util.formattime)
- [uuid4](#util.uuid4)

---
<a name="util.capitalisestring"></a>**capitaliseString** (string) : String  
Method to promote the first character of a string to uppercase.

Parameters:
- string : String

Returns:
- String

---
<a name="util.formattime"></a>**formatTime** (milliseconds) : String  
Formats an integer as milliseconds into a time string like: hours:minutes:seconds:milliseconds  

Parameters:
- milliseconds : Integer

Returns:
- String

---
<a name="util.uuid4"></a>**uuid4** ( ) : String  
Generates a Unique Universal Identifier.  
For example: ```91bb1fe1-e80e-452e-b506-2a83002caf78```

Returns:
- String

---
