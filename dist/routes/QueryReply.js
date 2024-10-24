import { DeleteRecord, InsertRecord, ReadRecord } from '../utils/mysql.js';
import CryptoEncryption from '../models/EncryptDecrypt.js';
const socketDataMap = new Map();
socketDataMap.set("INSERT", new Map());
socketDataMap.set("DELETE", new Map());
socketDataMap.set("FILTER", new Map());
socketDataMap.set("UPDATE", new Map());
socketDataMap.set("*", new Map());
const socketid = new Map();
function verifyObjFilter(obj1, obj2) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return [];
    }
    const filter = new Map(Object.entries(obj1));
    const result = [];
    for (let col of obj2) {
        let isMatch = true;
        for (let [key, value] of filter) {
            if (col[key] !== value) {
                isMatch = false;
                break;
            }
        }
        if (isMatch) {
            result.push(col);
        }
    }
    return result;
}
function isEmptyObject(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
// Express route handler
export const Symb = async (req, res) => {
    try {
        const encryptedData = req.body.encrypt;
        const password = process.env.PASSWORD || '';
        const crypt = new CryptoEncryption();
        const data = await crypt.jsondecrypt(encryptedData, password);
        // const data = req.body
        if (!data)
            return res.send({
                data: [],
                error: 'please send your valid query'
            });
        const { query, event, database, tablename, condition } = data;
        let result;
        if (event === "SELECT") {
            result = await ReadRecord(query, database);
        }
        else if (event === "DELETE") {
            result = await DeleteRecord(query, condition, database);
        }
        else {
            result = await InsertRecord(query, condition, database);
        }
        console.log(socketDataMap.get(event));
        console.log(socketDataMap.get(event)?.get(tablename)?.forEach((socket) => socket.channel));
        socketDataMap.get(event)?.get(tablename)?.forEach((socket) => {
            if (!isEmptyObject(socket.filter) && socket.database === database) {
                const newresult = verifyObjFilter(socket.filter, result);
                if (newresult.length > 0) {
                    socket.socketid.emit(socket.channel, { data: newresult, tablename: tablename });
                }
            }
            else if (socket.database === database) {
                socket.socketid.emit(socket.channel, { data: result, tablename: tablename });
            }
        });
        if (event !== "SELECT") {
            socketDataMap.get("*")?.get(tablename)?.forEach((socket) => {
                if (socket.database === database)
                    socket.socketid.emit(socket.channel, { data: result, tablename: tablename });
            });
        }
        console.warn("event :", event, " -- database :", database, " -- tablename :", tablename);
        return res.status(200).send({
            data: result,
            error: '',
        });
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({
            data: [],
            error: err.message || 'Internal Server Error',
        });
    }
};
export const SocketSymb = (socket) => {
    console.log('A user connected');
    socket.on('custom_insert_channel', (payload = "") => {
        const map = socketDataMap.get(payload.event);
        const obj = {
            channel: payload.channel,
            socketid: socket,
            database: payload.database,
            filter: {}
        };
        if (map !== undefined && map.has(payload.tablename)) {
            map.get(payload.tablename)?.push(obj);
        }
        else if (map != undefined) {
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        }
        if (socketid.has(socket.id)) {
        }
        console.log('custom_insert_channel :', socketDataMap);
    });
    socket.on('custom_update_channel', (payload) => {
        const map = socketDataMap.get(payload.event);
        const obj = {
            channel: payload.channel,
            socketid: socket,
            database: payload.database,
            filter: {}
        };
        if (map !== undefined && map.has(payload.tablename))
            map.get(payload.tablename)?.push(obj);
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });
    socket.on('custom_delete_channel', (payload) => {
        const map = socketDataMap.get(payload.event);
        const obj = {
            channel: payload.channel,
            socketid: socket,
            database: payload.database,
            filter: {}
        };
        if (map !== undefined && map.has(payload.tablename))
            map.get(payload.tablename)?.push(obj);
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });
    socket.on('custom_all_channel', (payload) => {
        const map = socketDataMap.get(payload.event);
        const obj = {
            channel: payload.channel,
            socketid: socket,
            database: payload.database,
            filter: {}
        };
        if (map !== undefined && map.has(payload.tablename))
            map.get(payload.tablename)?.push(obj);
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });
    socket.on('custom_filter_channel', (payload) => {
        const map = socketDataMap.get(payload.event);
        const obj = {
            channel: payload.channel,
            socketid: socket,
            database: payload.database,
            filter: payload.filter
        };
        if (map !== undefined && map.has(payload.tablename))
            map.get(payload.tablename)?.push(obj);
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });
    socket.on('custom_remove_channel', (payload) => {
        const map = socketDataMap.get(payload.event);
        if (map) {
            const array = map.get(payload.tablename);
            if (array) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(payload.tablename, updatedArray);
                }
                else {
                    map.delete(payload.tablename); // If the array is empty, delete the tableName entry
                }
            }
            if (map.size === 0) {
                socketDataMap.delete(payload.tablename); // If the map is empty, delete the event entry
            }
            console.log(`After deletion by event (${payload.event}), table (${payload.tablename}), and socket ID:`, socketDataMap);
        }
        ;
    });
    socket.on('custom_removeall_channel', () => {
        for (const [event, map] of socketDataMap.entries()) {
            for (const [tablename, array] of map.entries()) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(tablename, updatedArray);
                }
                else {
                    map.delete(tablename);
                }
            }
            console.log('After deletion by socket ID:', socketDataMap);
        }
        ;
    });
    socket.on('disconnect', () => {
        for (const [event, map] of socketDataMap.entries()) {
            for (const [tablename, array] of map.entries()) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(tablename, updatedArray);
                }
                else {
                    map.delete(tablename);
                }
            }
            console.log('After deletion by socket ID:', socketDataMap);
        }
        console.log('A user disconnected');
        console.log('map ', socketDataMap);
    });
};
