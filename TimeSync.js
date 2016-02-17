/*global WebSocket, TimeSync */
/*jslint browser: true, nomen: true */

"use strict";

// TODO: server needs to secure the messages that get send. When sending a malformed pong message
// the server will crash.
// TODO: implement echo message type

/** @Class TimeSync
 * Method to construct a TimeSync instance
 * @param cfg {Object} config object
 * 
 * @event connected {Object} fires when the server connection is established
 * @event connectionerror {Object} fires when an error occures during connection
 * @event disconnected {Object} fires when the server connection is closed
 * @event syncprogress {Object} fires when the sync progress changes
 * 
 */

// define the namespace
var TIMESYNC = TIMESYNC || {};

TIMESYNC.Client = function (cfg) {

    // make sure websockets are available
    if (!window.hasOwnProperty("WebSocket")) {
        throw ("The TimeSync Client requires Websockets");
    }

    cfg = cfg || {};

    // ************************************************************************ 
    // PRIVATE PROPERTIES
    // ************************************************************************ 

    // the actual time difference between the server and the client (us)
    var _clockOffset = 0,

        // the sync progress
        _progress = 0,

        // flag to indicate that we're connected to the server
        _connected = false,

        // flag to indicate that we're given control by the server
        // TODO: check if we still need this!
        // _control = false,

        // holding the websocket connection
        _connection,

        // holding the client uuid
        _id;

    // ************************************************************************ 
    // PUBLIC PROPERTIES
    // ************************************************************************ 

    this.config = {};

    // ************************************************************************ 
    // PRIVILEGED METHODS 
    // ************************************************************************ 

    this._setConnection = function (conn) { return _connection = conn; };

    this._setConnected = function (state) { _connected = state === true; return this; };

    this._setClockOffset = function (offset) { _clockOffset = offset; return this; };

    this._setSyncProgress = function (n) {
        if (_progress !== n) {
            _progress = n;
            this.fireEvent("syncprogress", n);
        }
        return this;
    };

    this.getId = function () { return _id = _id || TIMESYNC.util.uuid4(); };

    this.getConnection = function () { return _connection; };

    this.getConnected = function () { return _connected; };

    // TODO: rename this, confusing
    // this.getControl = function () { return _control; };

    // this.setControl = function (state) { _control = state === true; return this; };

    this.getClockOffset = function () { return _clockOffset; };

    this.getSyncProgress = function () { return _progress; };

    this.isSync = function () { return this.getSyncProgress() === 1; };

    // method to initialise a connection to the server
    this.connect = function (server, port) {
        server = server || this.config.server;
        port = port || this.config.port;

        // update the config
        this.config.server = server;
        this.config.port = port;

        var me = this,
            conn;

        this.log("Connecting", server, port);

        // create the websocket connection
        conn = new WebSocket("ws://" + server + ":" + port, "echo-protocol");

        // register connection response handlers
        conn.onmessage = function () { me.onConnMessage.apply(me, arguments); };
        conn.onopen = function () { me.onConnOpen.apply(me, arguments); };
        conn.onerror = function () { me.onConnError.apply(me, arguments); };
        conn.onclose = function () { me.onConnClose.apply(me, arguments); };

        return this._setConnection(conn);
    };

    this.disconnect = function () {
        this.getConnection().close();
        this._setConnection(null);
    };

    this.send = function (msg) {
        new TIMESYNC.Message(msg).bind(this).send();
    };

    // return a timestamp with the corrected clock offset
    this.clock = function () {
        if (this.getSyncProgress() < 1) { this.log("warn", "Clock syncing is still in progress. Clock value might be inacurate!"); }
        return this.now() + parseFloat(this.getClockOffset());  // ms
    };

    // return virgin timestamp
    this.now = function () {
        return (new Date()).getTime();  // ms
    };

    this.addListener = function (type, listener) {
        if (this.listeners.hasOwnProperty(type) === false) {
            this.listeners[type] = [];
        }

        this.listeners[type].push(listener);
        this.log("listener registered", type, listener);
    };

    this.fireEvent = function (event, details) {
        var i = 0,
            len,
            listeners;

        if (typeof event === "string") {
            event = { type: event };
        }

        if (!event.target) {
            event.target = this;
        }

        if (!event.details) {
            event.details = details;
        }

        if (!event.type) {
            throw new Error("Event object missing 'type' property");
        }

        if (this.listeners[event.type] instanceof Array) {
            listeners = this.listeners[event.type];
            len = listeners.length;

            for (i; i < len; i += 1) {
                if (listeners[i].call(this, event) === false) {
                    break;
                }
            }
        }
    };

    this.removeListener = function (type, listener) {
        var i = 0,
            len,
            listeners;

        if (this.listeners[type] instanceof Array) {
            listeners = this.listeners[type];
            len = listeners.length;

            for (i; i < len; i += 1) {
                if (listeners[i] === listener) {
                    listeners.splice(i, 1);
                    break;
                }
            }

            this.log("listener removed", type, listener);
        }
    };

    this.on = function () {
        return this.addListener.apply(this, arguments);
    };

    this.un = function () {
        return this.removeListener.apply(this, arguments);
    };

    // start init
    this.init(cfg);

    return this;
};

// ************************************************************************ 
// PUBLIC METHODS
// ************************************************************************ 

// namespace to hold all message handlers
TIMESYNC.Client.prototype.msgHandlers = {};

// namespace to hold all event listeners
TIMESYNC.Client.prototype.listeners = {};

TIMESYNC.Client.prototype.init = function (cfg) {

    // store config parameters
    this.config.debug = cfg.debug || false;
    this.config.server = cfg.server || window.location.hostname;
    this.config.port = cfg.port || 8080;
    this.config.autoReconnect = cfg.autoReconnect || true;

    // make sure our own uuid is set
    this.getId();

    // register default message handlers
    this.registerHandler("onPing", function (msg) {
        // if the ping message contains a progress in the body we'll pull it out
        // and update the progress indicator
        if (msg.body && msg.body.progress) {
            this._setSyncProgress(msg.body.progress);
        }

        // send a pong back to the server with a time stamp in the body
        msg.setType("pong");
        msg.setBody({ts: this.now()});
        msg.send();
    });

    this.registerHandler("clockOffset", function (msg) {
        this._setClockOffset(msg.body.offset);
        this._setSyncProgress(1);
    });

    this.registerHandler("userCount", function (msg) {
        this.log("userCount", msg.body.count);
        this.fireEvent("usercount", msg.body.count);
    });

    this.registerHandler("echo", function (msg) {
        this.log("echo", msg.body);
    });
};

TIMESYNC.Client.prototype.onConnOpen = function () {
    this.log("Connection established");
    this._setConnected(true);

    this.fireEvent("connected");
};

TIMESYNC.Client.prototype.onConnError = function (e) {
    this.log("error", "Connection error", e);
    this._setConnected(false);
    // setUserCount(false);

    this.fireEvent("connectionerror");
};

TIMESYNC.Client.prototype.onConnClose = function () {
    var me = this;

    this._setConnected(false);
    // this.setControl(false);
    // setUserCount(false);

    this.fireEvent("disconnected");

    if (this.config.autoReconnect) {
        setTimeout(function () {
            me.connect();
        }, 1000);
    }
};

// message router for the websocket connection
TIMESYNC.Client.prototype.onConnMessage = function (e) {
    var msg,
        handlerType,
        callback;

    // promote the message object to a TIMESYNC Message instance
    msg = new TIMESYNC.Message(e.data).bind(this);

    // check if we have registered a callback on the message
    callback = this.msgCallbacks[msg.id];
    if (callback) {
        callback.fn.call(callback.scope, msg.getBody());
        // cleanup the callback
        delete this.msgCallbacks[msg.id];
    }

    // call the appropriate message handler
    // Note: Message handlers are defined as on[Message.head.type] camelcased.
    // eg: onPing, where type is 'ping'
    handlerType = "on" + TIMESYNC.util.capitaliseString(msg.getType());
    if (this.msgHandlers.hasOwnProperty(handlerType)) {
        this.msgHandlers[handlerType].call(this, msg, this.getConnection());

    } else if (!callback) {
        this.log("warn", "No handler registered for type '" + msg.head.type + "' with Message", msg);
    }
};

// method to register a custom handler
TIMESYNC.Client.prototype.registerHandler = function (name, fn) {
    // input validation
    if (typeof name !== "string") { this.log("error", "expecting first parameter to be a string"); }
    if (typeof fn !== "function") { this.log("error", "expecting second paramter to be a function"); }

    // normalize the name
    if (name.indexOf("on") !== 0) { name = "on" + TIMESYNC.util.capitaliseString(name); }

    if (!this.msgHandlers.hasOwnProperty(name)) {
        this.msgHandlers[name] = fn;

    } else {
        throw ("handler with name '" + name + "' already exists");
    }
};

TIMESYNC.Client.prototype.log = function () {
    if (this.config.debug) {
        var args = [].slice.call(arguments),
            level = "info";

        if (args.length > 0 && ["log", "info", "debug", "warn", "error"].indexOf(args[0]) >= 0) {
            level = args.shift();
        }

        console[level].apply(console, args);
    }
};

TIMESYNC.Client.prototype.newMsg = function (type, body, callback, scope) {
    type = type || 'echo';
    body = body || '';

    var msg = new TIMESYNC.Message({head: {type: type}, body: body}).bind(this);

    // register the callback
    if (callback) {
        this.msgCallbacks[msg.id] = {fn: callback, scope: scope};
    }

    return msg;
};

TIMESYNC.Client.prototype.msgCallbacks = {}; 

/** @Class Message
 * TIMESYNC Message Class
 * @param cfg {Object} config object
 *     id:   (optional)
 *     head: {
 *          type: (String)
 *          clientId: (uuid)
 *          ts: (timestamp)
 *     },
 *     body: (optional)
 * 
 */
TIMESYNC.Message = function (cfg) {
    if (cfg === undefined) { throw ("Message expects a cfg object or JSON string"); }
    if (cfg instanceof TIMESYNC.Message) { return cfg; }
    if (typeof cfg === "string") { cfg = JSON.parse(cfg) || {}; }

    // ************************************************************************ 
    // PUBLIC PROPERTIES
    // ************************************************************************

    this.id = cfg.id || TIMESYNC.util.uuid4();
    this.head = cfg.head || {};
    this.body = cfg.body || {};

    // default to simple echo message type
    if (cfg.head.type === undefined) { cfg.head.type = "echo"; }
};

// ************************************************************************ 
// PUBLIC METHODS
// ************************************************************************ 

TIMESYNC.Message.prototype.client = undefined;

TIMESYNC.Message.prototype.bind = function (scope) {
    // method to bind this message to a client, so we can call send or respond on the message itself.
    // Note: the Client will bind any incoming messages by itself.

    if (!scope instanceof TIMESYNC.Client) { throw ("Message.bind expects a TIMESYNC.Client instance"); }

    // TODO: hide this.client in the prototype or private vars of Message,
    // as it now gets encoded into JSON for every message we send to the server.

    this.client = scope;
    this.head.clientId = this.client.getId();

    return this;
};

TIMESYNC.Message.prototype.toString = function () {
    return JSON.stringify(this);
};

// TODO: implement a callback registry so we don't have to create message handlers
// for each message type that we send to the server, just to receive a response.

TIMESYNC.Message.prototype.send = function () {
    if (this.validate()) {
        var conn = this.client.getConnection();

        if (conn) {
            if (this.getTs() === undefined) { this.setTs(this.client.clock()); }
            conn.send(this);

        } else {
            throw ("Client has no Connection available.");
        }
    }

    return this;
};

TIMESYNC.Message.prototype.validate = function () {
    if (this.client === undefined || this.head.clientId === undefined) { throw ("Message has no Client. Please use Message.bind to bind it to a TIMESYNC.Client"); }
    if (this.head.type === undefined) { throw ("Message type is undefined. Please use Message.setType to define a message type"); }
    return this;
};

TIMESYNC.Message.prototype.getType = function () { return this.head.type; };
TIMESYNC.Message.prototype.setType = function (type) { this.head.type = type; return this; };

TIMESYNC.Message.prototype.getTs = function () { return this.head.ts; };
TIMESYNC.Message.prototype.setTs = function (ts) { this.head.ts = ts; return this; };

TIMESYNC.Message.prototype.getBody = function () { return this.body; };
TIMESYNC.Message.prototype.setBody = function (body) { this.body = body; return this; };

// ************************************************************************ 
// HELPER FUNCTIONS 
// ************************************************************************ 

TIMESYNC.util = {};

TIMESYNC.util.capitaliseString = function (string) {
    // capitalise irst letter of a string
    return string.charAt(0).toUpperCase() + string.slice(1);
};

// TIMESYNC.util.pack = function (msg) {
//     return JSON.stringify(msg);
// };

TIMESYNC.util.formatTime = function (ms) {
    var date = new Date(ms),
        hours = date.getHours(),
        minutes = date.getMinutes(),
        seconds = date.getSeconds(),
        milliseconds = date.getMilliseconds();
    date = null;
    return hours + ':' + minutes + ':' + seconds + ":" + milliseconds;
};

TIMESYNC.util.uuid4 = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};
