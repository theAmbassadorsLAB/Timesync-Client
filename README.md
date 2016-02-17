# Timesync-Client
Javascript Client for the proprietary Ambassadors Timesync Server.


**newMsg**(type, body, callback, scope) : Message  
Convenience method to create a new message object and automatically bind it to the client. Optionally it allows for attaching a callback method and scope.

```
tsClient = new TIMESYNC.Client();
tsClient.connect("live.theambassadors.nl", 8080);

tsClient.newMsg('join_room',
  {roomId: 'test'},
  function(result) {
    console.debug(result);
  }
).send()
```

Parameters:

- type : String
- body : String / Object
- callback : Function (optional)
- scope : this reference (optional)

Returns:
 - Message object
