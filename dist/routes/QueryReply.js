import { DeleteRecord, InsertRecord, ReadRecord } from '../utils/mysql.js';
import CryptoEncryption from '../models/EncryptDecrypt.js';
const socketData = [];
const insertnumber = new Set();
const updatenumber = new Set();
const deletenumber = new Set();
const allnumber = new Set();
const filternumber = new Set();
// Express route handler
export const Symb = async (req, res) => {
    try {
        const encryptedData = req.body.encrypt; // Assuming the encrypted data is in `encryptedData`
        const password = process.env.PASSWORD || '';
        const crypt = new CryptoEncryption();
        const data = await crypt.jsondecrypt(encryptedData, password);
        if (!data)
            return res.send({
                data: [],
                error: 'please send your valid query'
            });
        const { query, event, tablename, condition } = data;
        let result;
        if (event === "SELECT") {
            result = await ReadRecord(query);
        }
        else if (event === "DELETE") {
            result = await DeleteRecord(query, condition);
        }
        else {
            result = await InsertRecord(query, condition);
        }
        switch (event) {
            case 'SELECT': break;
            case 'INSERT':
                console.log(event);
                insertnumber.forEach((i) => {
                    const socket = socketData[i];
                    if (socket.tablename.has(tablename)) {
                        socket.socketid.emit('custom_insert_channel', { data: result, tablename: tablename });
                    }
                });
                break;
            case 'UPDATE':
                updatenumber.forEach((i) => {
                    const socket = socketData[i];
                    if (socket.tablename.has(tablename)) {
                        socket.socketid.emit('custom_update_channel', { data: result, tablename: tablename });
                    }
                });
                break;
            case 'DELETE':
                deletenumber.forEach((i) => {
                    const socket = socketData[i];
                    if (socket.tablename.has(tablename)) {
                        socket.socketid.emit('custom_delete_channel', { data: result, tablename: tablename });
                    }
                });
                break;
            case 'FILTER':
                filternumber.forEach((i) => {
                    const socket = socketData[i];
                    if (socket.tablename.has(tablename)) {
                        socket.socketid.emit('custom_filter_channel', { data: result, tablename: tablename });
                    }
                });
                break;
        }
        if (event !== "SELECT") {
            allnumber.forEach((i) => {
                const socket = socketData[i];
                if (socket.tablename.has(tablename) && result.length > 0) {
                    socket.socketid.emit('custom_all_channel', { data: result, tablename: tablename });
                }
            });
        }
        console.warn("event :", event, " -- tablename :", tablename);
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
    socket.on('custom_insert_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            const obj = {
                event: 'INSERT',
                socketid: socket,
                tablename: new Set([...socketData[index].tablename, payload.tablename])
            };
            socketData[index] = obj;
        }
        else {
            const obj = {
                event: 'INSERT',
                socketid: socket,
                tablename: new Set([payload.tablename])
            };
            socketData.push(obj);
        }
        insertnumber.add(socketData.findIndex(s => s.socketid === socket));
    });
    socket.on('custom_update_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            const obj = {
                event: 'UPDATE',
                socketid: socket,
                tablename: new Set([...socketData[index].tablename, payload.tablename])
            };
            socketData[index] = obj;
        }
        else {
            const obj = {
                event: 'UPDATE',
                socketid: socket,
                tablename: new Set([payload.tablename])
            };
            socketData.push(obj);
        }
        updatenumber.add(socketData.findIndex(s => s.socketid === socket));
    });
    socket.on('custom_delete_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            const obj = {
                event: 'DELETE',
                socketid: socket,
                tablename: new Set([...socketData[index].tablename, payload.tablename])
            };
            socketData[index] = obj;
        }
        else {
            const obj = {
                event: 'DELETE',
                socketid: socket,
                tablename: new Set([payload.tablename])
            };
            socketData.push(obj);
        }
        deletenumber.add(socketData.findIndex(s => s.socketid === socket));
    });
    socket.on('custom_all_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            const obj = {
                event: '*',
                socketid: socket,
                tablename: new Set([...socketData[index].tablename, payload.tablename])
            };
            socketData[index] = obj;
        }
        else {
            const obj = {
                event: '*',
                socketid: socket,
                tablename: new Set([payload.tablename])
            };
            socketData.push(obj);
        }
        allnumber.add(socketData.findIndex(s => s.socketid === socket));
    });
    socket.on('custom_filter_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            const obj = {
                event: 'FILTER',
                socketid: socket,
                tablename: new Set([...socketData[index].tablename, payload.tablename]),
                filter: payload.filter
            };
            socketData[index] = obj;
        }
        else {
            const obj = {
                event: 'FILTER',
                socketid: socket,
                tablename: new Set([payload.tablename]),
                filter: payload.filter
            };
            socketData.push(obj);
        }
        filternumber.add(socketData.findIndex(s => s.socketid === socket));
    });
    socket.on('custom_remove_channel', (payload) => {
        const index = socketData.findIndex(s => s.socketid === socket);
        socketData[index].tablename.delete(payload.tablename);
        if (socketData[index].tablename.size == 0) {
            socketData[index].socketid.disconnect();
        }
    });
    socket.on('custom_removeall_channel', () => {
        const index = socketData.findIndex(s => s.socketid === socket);
        socketData[index].socketid.disconnect();
    });
    socket.on('disconnect', () => {
        console.log('A user disconnected');
        const index = socketData.findIndex(s => s.socketid === socket);
        if (index !== -1) {
            socketData.splice(index, 1);
            insertnumber.delete(index);
            updatenumber.delete(index);
            deletenumber.delete(index);
            allnumber.delete(index);
            filternumber.delete(index);
        }
    });
};
