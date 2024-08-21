

// Assuming socket is an object with a unique `id`
interface Socket {
    id: string;
}

const socket1: Socket = { id: 'socket1' };
const socket2: Socket = { id: 'socket2' };

// Initializing socketDataMap with events and empty maps
const socketDataMap: Map<string, Map<string, Array<any>>> = new Map();
socketDataMap.set("INSERT", new Map());
socketDataMap.set("DELETE", new Map());
socketDataMap.set("FILTER", new Map());
socketDataMap.set("UPDATE", new Map());
socketDataMap.set("*", new Map());

// Insertion function
const insert = (payload: any = "") => {
    const map: Map<string, any> | undefined = socketDataMap.get(payload.event);
    const obj: { channel: string, socket: Socket, filter?: any } = {
        channel: payload.channel,
        socket: payload.socket,
        filter: {}
    };
    if (map !== undefined && map.has(payload.tablename)) {
        map.get(payload.tablename)?.push(obj);
    } else if (map !== undefined) {
        socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
    }
    console.log('custom_insert_channel :', socketDataMap);
};

// Deletion function by socketId
const deleteSocketById = (socketId: string) => {
    for (const [event, map] of socketDataMap.entries()) {
        for (const [tableName, array] of map.entries()) {
            const updatedArray = array.filter(obj => obj.socket.id !== socketId);

            if (updatedArray.length > 0) {
                map.set(tableName, updatedArray);
            } else {
                map.delete(tableName);
            }
        }
        if (map.size === 0) {
            socketDataMap.delete(event);
        }
    }

    console.log('After deletion by socket ID:', socketDataMap);
};

// Deletion function by event name and socketId
const deleteSocketByEventAndId = (eventName: string, socketId: string) => {
    const map = socketDataMap.get(eventName);
    if (map) {
        for (const [tableName, array] of map.entries()) {
            const updatedArray = array.filter(obj => obj.socket.id !== socketId);

            if (updatedArray.length > 0) {
                map.set(tableName, updatedArray);
            } else {
                map.delete(tableName);
            }
        }
        if (map.size === 0) {
            socketDataMap.delete(eventName);
        }
    }

    console.log(`After deletion by event (${eventName}) and socket ID:`, socketDataMap);
};

// Example Usage

// Insert socket1 into the INSERT event for table 'users'
insert({ event: 'INSERT', tablename: 'users', channel: 'channel1', socket: socket1 });
// Insert socket2 into the DELETE event for table 'orders'
insert({ event: 'DELETE', tablename: 'orders', channel: 'channel2', socket: socket2 });

// Insert another socket1 into the DELETE event for table 'orders'
insert({ event: 'DELETE', tablename: 'orders', channel: 'channel3', socket: socket1 });

// Deletion example by socket ID (deletes socket1 from all events)
deleteSocketById('socket1');

// Insert again for demonstration of specific deletion
insert({ event: 'INSERT', tablename: 'users', channel: 'channel1', socket: socket1 });
insert({ event: 'DELETE', tablename: 'orders', channel: 'channel2', socket: socket1 });

// Deletion example by specific event and socket ID
deleteSocketByEventAndId('INSERT', 'socket1');

