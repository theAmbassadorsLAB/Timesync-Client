# Timesync-Client
Javascript Client for the proprietary Ambassadors Timesync Server.

- [TIMESYNC.Client ](#client)
- [TIMESYNC.Message ](#message)
- [TIMESYNC.Util ](#util)


## <a name="client"></a>TIMESYNC.Client ##

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
- [isSync](#client.issync)
- [log](#client.log)
- [newMsg](#client.newmsg)
- [now](#client.now)
- [registerHandler](#client.registerhandler)
- [removeListener](#client.removelistener)
- [send](#client.send)

<a name="client.addlistener"></a>**addListener** (type, listener) : Client 

Adds an event listener to the client. For a list of events take a look at the Events section.

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
- details : String / Object / Array

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
- body : String / Object
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

<a name="client.registerhandler"></a>**registerHandler** (type, listener) : Client 

Method to register event handlers. For a full list of supported events please see the Events section.

Parameters:
- type : String
- listener : Function

Returns:
- Client

===

<a name="client.removelistener"></a>**removeListener** (type, listener)  

Removes a previously registere event listener

Parameters:
- type : String
- listener : Function

===

<a name="client.send"></a>**send** (msg)  

Method to send a Message to the server. The 'msg' can be supplied as an instantiated Message object, a config object or JSON formatted string.

Parameters:
- msg : Message / Object / JSON

===


## <a name="message"></a>TIMESYNC.Message ##

Message protocol inspired by 0MQ.

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

<a name="message.getbody"></a>**getBody** ( ) : String / Object  
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
- body (String / Object / Array)

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

