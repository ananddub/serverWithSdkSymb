import { Request, Response } from 'express';

import dotenv from 'dotenv'
import { DeleteRecord, InsertRecord, ReadRecord } from '../utils/mysql.js'
import { Server, Socket } from 'socket.io'
import crypto from 'crypto'
import CryptoEncryption from '../models/EncryptDecrypt.js';
const socketDataMap: Map<string, Map<string, Array<any>>> = new Map();
socketDataMap.set("INSERT", new Map())
socketDataMap.set("DELETE", new Map())
socketDataMap.set("FILTER", new Map())
socketDataMap.set("UPDATE", new Map())
socketDataMap.set("*", new Map())

const socketid: Map<string, Map<string, Map<string, any>>> = new Map()
type Socketstore = {
    socketid: Socket,
    channel: string,
    filter?: any
};
type QuerySymb = {
    query: string,
    event: string,
    tablename: string,
    condition: string
}


function verifyObjFilter(obj1: any, obj2: any) {
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return [];
    }
    const filter = new Map(Object.entries(obj1));
    const result: any[] = [];
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
function isEmptyObject(obj: any) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}
// Express route handler
export const Symb = async (req: Request, res: Response) => {
    try {
        const encryptedData = req.body.encrypt;
        const password = process.env.PASSWORD || '';
        const crypt = new CryptoEncryption()
        const data = await crypt.jsondecrypt(encryptedData, password);
        // const data = req.body
        if (!data) return res.send({
            data: [],
            error: 'please send your valid query'
        });
        const { query, event, tablename, condition }: QuerySymb = data;
        let result: any;
        if (event === "SELECT") {
            result = await ReadRecord(query);
        } else if (event === "DELETE") {
            result = await DeleteRecord(query, condition);
        } else {
            result = await InsertRecord(query, condition);
        }
        console.log(socketDataMap.get(event))
        console.log(socketDataMap.get(event)?.get(tablename)?.forEach((socket) => socket.channel))

        socketDataMap.get(event)?.get(tablename)?.forEach((socket: any) => {
            if (!isEmptyObject(socket.filter)) {
                const newresult = verifyObjFilter(socket.filter, result)
                if (newresult.length > 0) {
                    socket.socketid.emit(socket.channel, { data: newresult, tablename: tablename });
                }
            } else {
                socket.socketid.emit(socket.channel, { data: result, tablename: tablename });
            }
        });
        if (event !== "SELECT") {
            socketDataMap.get("*")?.get(tablename)?.forEach((socket: any) => {
                socket.socketid.emit(socket.channel, { data: result, tablename: tablename });
            });
        }

        console.warn("event :", event, " -- tablename :", tablename)
        return res.status(200).send({
            data: result,
            error: '',
        });

    } catch (err: any) {
        console.log(err);
        return res.status(500).send({
            data: [],
            error: err.message || 'Internal Server Error',
        });
    }
}
export const SocketSymb = (socket: Socket) => {
    console.log('A user connected');
    socket.on('custom_insert_channel', (payload: any = "") => {
        const map: Map<string, any> | undefined = socketDataMap.get(payload.event)
        const obj: Socketstore = {
            channel: payload.channel,
            socketid: socket,
            filter: {}
        }
        if (map !== undefined && map.has(payload.tablename)) {
            map.get(payload.tablename)?.push(obj)
        }
        else if (map != undefined) {
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        }
        if (socketid.has(socket.id)) {
        }
        console.log('custom_insert_channel :', socketDataMap);
    });

    socket.on('custom_update_channel', (payload: any) => {
        const map: Map<string, any> | undefined = socketDataMap.get(payload.event)
        const obj = {
            channel: payload.channel,
            socketid: socket,
            filter: {}
        }
        if (map !== undefined && map.has(payload.tablename)) map.get(payload.tablename)?.push(obj)
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });

    socket.on('custom_delete_channel', (payload: any) => {
        const map: Map<string, any> | undefined = socketDataMap.get(payload.event)
        const obj = {
            channel: payload.channel,
            socketid: socket,
            filter: {}
        }
        if (map !== undefined && map.has(payload.tablename)) map.get(payload.tablename)?.push(obj)
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });

    socket.on('custom_all_channel', (payload: any) => {
        const map: Map<string, any> | undefined = socketDataMap.get(payload.event)
        const obj = {
            channel: payload.channel,
            socketid: socket,
            filter: {}
        }
        if (map !== undefined && map.has(payload.tablename)) map.get(payload.tablename)?.push(obj)
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });

    socket.on('custom_filter_channel', (payload: any) => {
        const map: Map<string, any> | undefined = socketDataMap.get(payload.event)
        const obj = {
            channel: payload.channel,
            socketid: socket,
            filter: payload.filter
        }
        if (map !== undefined && map.has(payload.tablename)) map.get(payload.tablename)?.push(obj)
        else if (map != undefined)
            socketDataMap.get(payload.event)?.set(payload.tablename, [obj]);
        console.log('custom_insert_channel :', socketDataMap);
    });

    socket.on('custom_remove_channel', (payload: any) => {
        const map = socketDataMap.get(payload.event);
        if (map) {
            const array = map.get(payload.tablename);
            if (array) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(payload.tablename, updatedArray);
                } else {
                    map.delete(payload.tablename);  // If the array is empty, delete the tableName entry
                }
            }
            if (map.size === 0) {
                socketDataMap.delete(payload.tablename);  // If the map is empty, delete the event entry
            }
            console.log(`After deletion by event (${payload.event}), table (${payload.tablename}), and socket ID:`, socketDataMap);
        };
    })
    socket.on('custom_removeall_channel', () => {
        for (const [event, map] of socketDataMap.entries()) {
            for (const [tablename, array] of map.entries()) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(tablename, updatedArray);
                } else {
                    map.delete(tablename);
                }
            }
            console.log('After deletion by socket ID:', socketDataMap);
        };
    })

    socket.on('disconnect', () => {
        for (const [event, map] of socketDataMap.entries()) {
            for (const [tablename, array] of map.entries()) {
                const updatedArray = array.filter(obj => obj.socketid.id !== socket.id);
                if (updatedArray.length > 0) {
                    map.set(tablename, updatedArray);
                } else {
                    map.delete(tablename);
                }
            }
            console.log('After deletion by socket ID:', socketDataMap);
        }
        console.log('A user disconnected');
        console.log('map ', socketDataMap)
    });
}
