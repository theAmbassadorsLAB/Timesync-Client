# Timesync-Client
Javascript Client for the Ambassadors Timesync Server.

- [TIMESYNC.Client](#client)
  * [Messages](#client.messages)
  * [Properties](#client.properties)
  * [Methods](#client.methods)
  * [Events](#client.events)
- [TIMESYNC.Message](#message)
  * [Methods](#message.methods)
- [TIMESYNC.util](#util)
  * [Methods](#util.methods)

## <a name="client"></a>TIMESYNC.Client ##

The Timesync Client is used to establish a websocket connection to the Timesync Server, which in turn initiates a series of ping requests to establish the time offset between the server and the client, regardless of network delay or instability. Once the server has reached confidence it has established the offset, it will notify the client and pass it the offset.  

A development server is running on the following address:
```
ws://timesync.nl020.cube-cloud.com
```

The Client and Server communicate with eachother by sending Messages over the websocket connection. In general, Messages contain a unique id, a timestamp that gets set when dispatched, a message type and message body. The type is used to trigger specific behaviour on either end and the body contains any type of JSON serializable content. The Client can either register message handlers to act on incoming messages, or attach a callback and scope to outgoing messages.

Apart from establishing an accurate sync, the server exposes several other features. It incorporates 'rooms' which can be created or joined. Rooms can also store arbitrary properties. This is great when you want to save application state onto the room, which then can be accessed by other clients when they join the room. State changes are always broadcasted to all users in the same room.

The Server will act on a specific set of Message types as described below, but will broadcast any 'unknown' messages to all users of the same room. This is great to instantly push application state from any user to all other users. Think of a play / pause event, or game start event etc.

Currently the following Server communication is supported:

### <a name="client.messages"></a>Messages:

- [clockOffset](#server.clockoffset) _(private)_
- [echo](#server.echo)
- [get_rooms](#server.get_rooms)
- [get_room_properties](#server.get_room_properties)
- [join_room](#server.join_room)
- [leave_room](#server.leave_room)
- [ping](#server.ping) _(private)_
- [pong](#server.pong) _(private)_
- [request_new_room](#server.request_new_room)
- [request_time_offset](#server.request_time_offset)
- [room_properties_changed](#server.room_properties_changed) _(private)_
- [set_room_properties](#server.set_room_properties)
- [userCount](#server.userCount) _(private)_

===

<a name="server.clockoffset"></a>**clockOffset** ( ) : Integer _(private)_  
A Server initiated message that gets sent as soon as the sync offset has been determined.

Body:
- offset : Integer

===

<a name="server.echo"></a>**echo** (...) : Anything JSON serializable  
The echo message is a simple debug message type intended for testing server / client response. The server will simply bounce the message back to the client.

===

<a name="server.get_rooms"></a>**get_rooms** ( ) : Array  
Requests a list of all available rooms. Use a callback or register a 'get_rooms' message handler before dispatching the message.

Body:
- rooms : Array

===

<a name="server.get_room_properties"></a>**get_room_properties** ( ) : Object  
Requests the current properties of the room. Use a callback or register a 'get_room_properties' message handler before dispatching the message.

Body:
- properties : Object

===

<a name="server.join_room"></a>**join_room** (room) : Boolean  
Requests to join a specific room. If the room does not exist, it will be created. Use a callback or register a 'join_room' message handler before dispatching the message.

Body:
- success : Boolean

===

<a name="server.leave_room"></a>**leave_room** ( ) : Boolean  
Requests to leave the current room. Use a callback or register a 'leave_room' message handler before dispatching the message.

Body:
- success : Boolean

===

<a name="server.ping"></a>**ping** ( ) _(private)_  
Internal message type used for sync establishment, initiated by the Server.

===

<a name="server.pong"></a>**pong** ( ) _(private)_  
Internal message type used for sync establishment, responded by the Client.

===

<a name="server.request_new_room"></a>**request_new_room** ( )  
Request the server to create a new room and join it automatically. The room id will be generated by the server to ensure that it is unique. Use a callback or register a 'request_new_room' message handler before dispatching the message.

Body:
- room : room ID

===

<a name="server.request_time_offset"></a>**request_time_offset** ( )  
Request the server to initiate the sync process and estimate a time offset. This will initiate a series of ping request from the server to the client to estimate the clock offset. Once the estimation has been established the server will send a 'clockOffset' message and the client will fire a 'syncestablished' event.

Note: if the 'autoInitSync' config property is set to true (default) and a time offset has not previously been established, a time offset request will automatically be made on a succesfull server connection.

===

<a name="server.room_properties_changed"></a>**room_properties_changed** ( ) : Object _(private)_  
A Server initiated message to indicate that some or all room properties have changed.

Body:
- properties : Object

===

<a name="server.set_room_properties"></a>**set_room_properties** (properties) : Boolean  
Request the server to store or update the given properties onto the room.

===

<a name="server.userCount"></a>**userCount** ( ) : Integer _(private)_  
A Server initiated message to notify the current user count. This gets triggered everytime a user joins or leaves the room.

Body:
- count : Integer

===

### <a name="client.properties"></a>Properties:
- debug : Boolean, enable debug messages.
- server : String, the server address to connect to.
- port : Integer (optional), the server port to connect on, defaults to 80.
- autoReconnect : boolean (optional), automatically reconnect when the server connection is dropped, defaults to true.
- autoInitSync : boolean (optional), automatically initiate a sync request to the server on a successful connection, defaults to true.

===

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
- [initSync](#client.initsync)
- [isSync](#client.issync)
- [log](#client.log)
- [newMsg](#client.newmsg)
- [now](#client.now)
- [registerHandler](#client.registerhandler)
- [removeListener](#client.removelistener)
- [send](#client.send)

===

<a name="client.addlistener"></a>**addListener** (type, listener) : Client  
Adds an event listener to the client. For a list of events take a look at the [Events](#client.events) section.

Parameters:
- type : String
- listener : Function

Returns:
- Client

===

<a name="client.clock"></a>**clock** ( ) : Integer  
Returns the offset corrected current time. If the offset has not been established a warning will be printed in the logs.

Returns:
- Integer

===

<a name="client.connect"></a>**connect** (server, port) : Websocket Connection  
Initiates a connection to the server. If no server and port parameters are provided it will grab them from the initial client config.

Parameters:
- server : String (optional)
- port : Integer (optional)

Returns:
- Websocket Connection

===

<a name="client.disconnect"></a>**disconnect** ( )  
Closes the server connection.

===

<a name="client.fireevent"></a>**fireEvent** (event, details) : Client  
Method to fire an event. Any prior registered event listeners will be executed.

Parameters:
- event : String
- details : Anything

Returns:
- Client

===

<a name="client.getclockoffset"></a>**getClockOffset** ( ) : Integer  
Returns the time offset as estimated by the server

Returns:
- Integer

===

<a name="client.getconnected"></a>**getConnected** ( ) : Boolean  
Method to return the connection state. Returns true if connected, false if not.

Returns:
- Boolean

===

<a name="client.getconnection"></a>**getConnection** ( ) : Websocket Connection  
Method to return the current websocket connection.

Returns:
- Websocket Connection

===

<a name="client.getid"></a>**getId** ( ) : UUID  
Method to return the ID of the Client instance.

Returns:
- String

===

<a name="client.getsyncprogress"></a>**getSyncProgress** ( ) : Float  
Method to return the current time syncing progress. Note: alternatively one could use the 'syncprogress' event to receive regular updates on the sync progress.

Returns:
- Float

===

<a name="client.initsync"></a>**initSync** ( )  
Method to initiate the sync process between the server and the client.

Note: if the 'autoInitSync' config property is set to true (default) and a time offset has not previously been established, a time offset request will automatically be made on a succesfull server connection.

===

<a name="client.issync"></a>**isSync** ( ) : Boolean  
Method to return the sync state. Returns true if a sync has been established, false if not.

Returns:
- Boolean

===

<a name="client.log"></a>**log** (arguments)  
Convenience method to log console messages that will be honor the debug state as defined in the Client config.

===

<a name="client.newmsg"></a>**newMsg** (type, body, callback, scope) : Message  
Convenience method to create a new message object and automatically bind it to the client. Optionally it allows for attaching a callback method and scope.

```
tsClient = new TIMESYNC.Client();
tsClient.connect("live.theambassadors.nl", 8080);

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

===

<a name="client.now"></a>**now** ( ) : Integer  
Convenience method to get the current time in milliseconds without offset. Note: use clock() to get the current time with offset correction.

Returns:
- Integer

===

<a name="client.registerhandler"></a>**registerHandler** (type, handler) : Client  
Method to register Message handlers. For a full list of supported Messages please see the [Messages](#client.messages) section.

Parameters:
- type : String
- handler : Function

Returns:
- Client

===

<a name="client.removelistener"></a>**removeListener** (type, listener)  
Removes a previously registere event listener. For a list of events take a look at the [Events](#client.events) section.

Parameters:
- type : String
- listener : Function

===

<a name="client.send"></a>**send** (msg)  
Method to send a Message to the server. The 'msg' can be supplied as an instantiated Message object, a config object or JSON formatted string.

Parameters:
- msg : Message / Object / JSON

===

### <a name="client.events"></a>Events:

- [connected](#events.connected)
- [connectionerror](#events.connectionerror)
- [disconnected](#events.disconnected)
- [syncestablished](#events.syncestablished)
- [syncprogress](#events.syncprogress)
- [usercount](#events.usercount)

<a name="events.connected"></a>**connected** ( )  
Fires when the client has successfully initiated a server connection.

==

<a name="events.connectionerror"></a>**connectionerror** (e)  
Fires when the client has successfully initiated a server connection.

Parameters:
- e : Error

===

<a name="events.disconnected"></a>**disconnected** (e)  
Fires when the client has been disconnected from the server.

===

<a name="events.syncestablished"></a>**syncestablished** (offset)  
Fires when the client and server have successfully estimated the time offset.

Parameters:
- offset : Integer

===

<a name="events.syncprogress"></a>**syncprogress** (progress)  
Fires when the sync progress changes.

Parameters:
- progress : Float

===

<a name="events.usercount"></a>**usercount** (count)  
Fires when the usercount changes. This happends when people join or leave the room.

Parameters:
- count : Integer

===

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

===

<a name="message.bind"></a>**bind** (client) : Message  
Method to bind the message to the client. This is needed so it can be sent to the server thru the client.

Parameters:
- client (Client)

Returns:
- Message

===

<a name="message.getbody"></a>**getBody** ( ) : Anything JSON serializable  
Convenience method to get the body contents of a message object.

===

<a name="message.getclient"></a>**getClient** ( ) : Client  
Method to get the client of this message, if it has been bound before.

Returns:
- Client

===

<a name="message.getts"></a>**getTs** ( ) : Integer  
Convenience method to get the message timestamp.

Returns:
- Integer

===

<a name="message.gettype"></a>**getType** ( ) : String  
Convenience method to get the type of a message object.

Returns:
- String

===

<a name="message.send"></a>**send** ( ) : Message  
Method to send the message to the server. Note: the message needs to be bound to the client with the 'bind' method first.

Returns:
- Message

===

<a name="message.setbody"></a>**setBody** (body) : Message  
Convenience method to directly set the body contents of a message object.

Parameters:
- body (Anything JSON serializable)

Returns:
- Message

===

<a name="message.setts"></a>**setTs** (timestamp) : Message  
Convenience method to set the dispatch timestamp of a message. The timestamp lives in the message head. This rarely needs to bet set directly though, as it is set as soon as the message is sent to the server, which is what you normally would want.

Parameters:
- timestamp (Integer)

Returns:
- Message

===

<a name="message.settype"></a>**setType** (type) : Message  
Convenience method to set the type of the message object.

Parameters:
- type (String)

Returns:
- Message

===

<a name="message.validate"></a>**validate** ( ) : Message  
A validation method to make sure the message is poperly formatted. It will throw up errors when it encounters problems, but always returns the Message object so it can be used in concatenation.

Returns:
- Message

===



## <a name="util"></a>TIMESYNC.util ##

General utility methods.

### <a name="util.methods"></a>Methods:

- [capitaliseString](#util.capitalisestring)
- [formatTime](#util.formattime)
- [uuid4](#util.uuid4)

===

<a name="util.capitalisestring"></a>**capitaliseString** (string) : String  
Method to promote the first character of a string to uppercase.

Parameters:
- string : String

Returns:
- String

===

<a name="util.formattime"></a>**formatTime** (milliseconds) : String  
Formats an integer as milliseconds into a time string like: hours:minutes:seconds:milliseconds  

Parameters:
- milliseconds : Integer

Returns: 
- String

===

<a name="util.uuid4"></a>**uuid4** ( ) : String  
Generates a Unique Universal Identifier.  
For example: ```91bb1fe1-e80e-452e-b506-2a83002caf78```

Returns:
- String

===

