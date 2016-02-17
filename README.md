# Timesync-Client
Javascript Client for the proprietary Ambassadors Timesync Server.

- [TIMESYNC.Client ](#client)
- [TIMESYNC.Message ](#message)
- [TIMESYNC.Util ](#util)


## <a name="client"></a>TIMESYNC.Client ##

**newMsg** (type, body, callback, scope) : Message  
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

**getId** ( ) : UUID  

===

**getConnection** ( ) : Websocket Connection  

===

**getConnected** ( ) : Boolean  

===

**getClockOffset** ( ) : Integer  

===

**getSyncProgress** ( ) : Float  

===

**isSync** ( ) : Boolean  

===

**connect** (server, port) : Websocket Connection  

===

**disconnect** ( )  

===

**send** (msg)  

===

**clock** ( ) : Integer  

===

**now** ( ) : Integer  

===

**addListener** (type, listener)  

===

**fireEvent** (event, details)  

===

**removeListener** (type, listener)  

===

**registerHandler** (name, fn)  

===

**log** (arguments)  

===


## <a name="message"></a>TIMESYNC.Message ##

**bind** (client) : Message  
Method to bind the message to the client. This is needed so it can be sent to the server thru the client.

Properties:
- client (Client)

Returns:
- Message

===

**getClient** ( ) : Client  
Method to get the client of this message, if it has been bound before.

Returns:
- Client

===

**send** ( ) : Message  
Method to send the message to the server. Note: the message needs to be bound to the client with the 'bind' method first.

Returns:
- Message

===

**validate** ( ) : Message  
A validation method to make sure the message is poperly formatted. It will throw up errors when it encounters problems, but always returns the Message object so it can be used in concatenation.

Returns:
- Message

===

**getType** ( ) : String  
Convenience method to get the type of a message object.

Returns:
- String

===

**setType** (type) : Message  
Convenience method to set the type of the message object.

Properties:
- type (String)

Returns:
- Message

===

**getTs** ( ) : Integer  
Convenience method to get the message timestamp.

Returns:
- Integer

===

**setTs** (timestamp) : Message  
Convenience method to set the dispatch timestamp of a message. The timestamp lives in the message head. This rarely needs to bet set directly though, as it is set as soon as the message is sent to the server, which is what you normally would want.

Properties:
- timestamp (Integer)

Returns:
- Message

===

**getBody** ( ) : String / Object  
Convenience method to get the body contents of a message object.

===

**setBody** (body) : Message  
Convenience method to directly set the body contents of a message object.

Properties:
- body (String / Object / Array)

===



## <a name="util"></a>TIMESYNC.util ##

**capitaliseString** (string) : String  

===

**formatTime** (milliseconds) : String  
Formats an integer as milliseconds into a time string like: hours:minutes:seconds:milliseconds  

Returns: 
- String

===

**uuid4** ( ) : String  
Generates a Unique Universal Identifier.  
For example: ```91bb1fe1-e80e-452e-b506-2a83002caf78```

Returns:
- String

===

