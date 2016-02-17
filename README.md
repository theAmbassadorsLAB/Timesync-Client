# Timesync-Client
Javascript Client for the proprietary Ambassadors Timesync Server.



## TIMESYNC.Client ##

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


## TIMESYNC.Message ##

**bind** (client) : Message  

===

**getClient** ( ) : Client  

===

**send** ( ) : Message  

===

**validate** ( ) : Message  

===

**getType** ( ) : String  

===

**setType** (type) : Message  

===

**getTs** ( ) : Integer  

===

**setTs** (timestamp) : Message  

===

**getBody** ( ) : String / Object  

===

**setBody** (body) : Message  

===



## TIMESYNC.util ##

**capitaliseString** (string) : String  

===

**formatTime** (milliseconds) : Integer  

===

**uuid4** ( ) : String  
Generates a Unique Universal Identifier.  
For example: ```91bb1fe1-e80e-452e-b506-2a83002caf78```

**Returns:**
- UUID : String

===

