import mysql from 'mysql';
export const localDatabase = {
    host: "localhost",
    user: "root",
    password: "root",
    database: "sisdb",
};
export async function CreateRecord(query) {
    const db = mysql.createConnection(localDatabase);
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err)
                    reject(err);
                resolve("done");
                console.log("Connected to database");
            });
        });
        const value = await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        console.log("conection end");
        return value;
    }
    catch (err) {
        console.error("Error:", err);
        console.log("conection end");
        return err;
    }
    finally {
        db.end();
    }
}
export async function ReadRecord(query) {
    const db = mysql.createConnection(localDatabase);
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err)
                    reject(err);
                resolve("done");
                console.log("Connected to database");
            });
        });
        const value = await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        console.log("conection end");
        return value;
    }
    catch (err) {
        console.error("Error:", err);
        console.log("conection end");
        return {
            sqlMessage: err.sqlMessage,
            sql: err.sql
        };
    }
    finally {
        db.end();
    }
}
export async function InsertRecord(query, conditionquery) {
    const db = mysql.createConnection(localDatabase);
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err)
                    reject(err);
                resolve("done");
                console.log("Connected to database");
            });
        });
        await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        const value = await new Promise((resolve, reject) => {
            db.query(conditionquery, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        console.log("conection end");
        return value;
    }
    catch (err) {
        console.error("Error:", err);
        console.log("conection end");
        return err;
    }
    finally {
        db.end();
    }
}
export async function DeleteRecord(query, conditionquery) {
    const db = mysql.createConnection(localDatabase);
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err)
                    reject(err);
                resolve("done");
                console.log("Connected to database");
            });
        });
        const value = await new Promise((resolve, reject) => {
            db.query(conditionquery, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        console.log("conection end");
        return value;
    }
    catch (err) {
        console.error("Error:", err);
        console.log("conection end");
        return err;
    }
    finally {
        db.end();
    }
}
export async function UpdateRecord(query) {
    const db = mysql.createConnection(localDatabase);
    try {
        await new Promise((resolve, reject) => {
            db.connect((err) => {
                if (err)
                    reject(err);
                resolve("done");
                console.log("Connected to database");
            });
        });
        const value = await new Promise((resolve, reject) => {
            db.query(query, (err, result) => {
                if (err)
                    reject(err);
                resolve(result);
            });
        });
        console.log("conection end");
        return value;
    }
    catch (err) {
        console.error("Error:", err);
        console.log("conection end");
        return err;
    }
    finally {
        db.end();
    }
}
