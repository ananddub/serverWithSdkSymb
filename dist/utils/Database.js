import { DeleteRecord, InsertRecord, ReadRecord } from "./mysql.js";
class Mysqldatabase {
    constructor(operation = "") {
        this.query = "";
        this.conditions = [];
        this.operation = "";
        this.orderby = [];
        this.limit = null;
        this.offset = null;
        this.socketurl = "";
        this.groupby = [];
        this.serverurl = "";
        this.whereinsert = "";
        this.socket = [];
        this.returnvalue = {
            query: "",
            condition: "",
            tablename: "",
            event: "",
            key: "",
        };
        this.operation = operation;
    }
    groupBy(column) {
        this.groupby.push(column);
        return this;
    }
    select(columns = "*") {
        this.query = `SELECT ${columns}`;
        this.returnvalue.event = "SELECT";
        return this;
    }
    from(table) {
        this.query += ` FROM ${table}`;
        this.returnvalue.tablename = table;
        return this;
    }
    insert(rows) {
        this.operation = "insert";
        // Collect all unique columns from rows
        const columnsSet = new Set();
        rows.forEach((row) => Object.keys(row).forEach((key) => columnsSet.add(key)));
        const columns = Array.from(columnsSet).join(", ");
        const values = rows
            .map((row) => `${Object.values(row)
            .map((val) => `'${val}'`)
            .join(", ")}`)
            .join(", ");
        // Build the final query
        this.query = `INSERT INTO ${this.returnvalue.tablename} (${columns}) VALUES (${values})`;
        let c = 0;
        for (let x of rows) {
            const arr = Object.entries(x)[0];
            console.log(arr[0]);
            this.whereinsert += `${arr[0]}='${arr[1]}' `;
            if (c != rows.length - 1)
                this.whereinsert += `AND `;
            c++;
        }
        this.returnvalue.event = "INSERT";
        return this;
    }
    upsert(rows) {
        this.operation = "upsert";
        // Collect all unique columns from rows
        const columnsSet = new Set();
        rows.forEach((row) => Object.keys(row).forEach((key) => columnsSet.add(key)));
        const columns = Array.from(columnsSet).join(", ");
        const values = rows
            .map((row) => `${Object.values(row)
            .map((val) => `'${val}'`)
            .join(", ")}`)
            .join(", ");
        // Build the final query
        this.query = `INSERT INTO ${this.returnvalue.tablename} (${columns}) VALUES ${values} ON CONFLICT DO NOTHING`;
        this.returnvalue.event = "INSERT";
        let c = 0;
        for (let x of rows) {
            const arr = Object.entries(x)[0];
            console.log(arr[0]);
            this.whereinsert += `${arr[0]}='${arr[1]}' `;
            if (c != rows.length - 1)
                this.whereinsert += `AND `;
            c++;
        }
        return this;
    }
    update(updateObj) {
        this.operation = "update";
        this.query = `UPDATE ${this.returnvalue.tablename} SET ${Object.entries(updateObj)
            .map(([key, value]) => `${key} = '${value}'`)
            .join(", ")}`;
        this.returnvalue.event = "UPDATE";
        return this;
    }
    delete() {
        this.operation = "delete";
        this.query = `DELETE  ${this.query}`;
        this.returnvalue.event = "DELETE";
        return this;
    }
    eq(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} = ${formattedValue}`);
        return this;
    }
    gt(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} > ${formattedValue}`);
        return this;
    }
    lt(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} < ${formattedValue}`);
        return this;
    }
    gte(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} >= ${formattedValue}`);
        return this;
    }
    lte(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} <= ${formattedValue}`);
        return this;
    }
    like(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} LIKE ${formattedValue}`);
        return this;
    }
    ilike(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} ILIKE ${formattedValue}`);
        return this;
    }
    is(column, value, status = true) {
        if (value === null) {
            this.conditions.push(`${column} IS NULL`);
        }
        else {
            const formattedValue = status ? `'${value}'` : `${value}`;
            this.conditions.push(`${column} IS ${formattedValue}`);
        }
        return this;
    }
    in(column, values, status = true) {
        const formattedValues = values
            .map((val) => (status ? `'${val}'` : `${val}`))
            .join(", ");
        this.conditions.push(`${column} IN (${formattedValues})`);
        return this;
    }
    nin(column, values, status = true) {
        const formattedValues = values
            .map((val) => (status ? `'${val}'` : `${val}`))
            .join(", ");
        this.conditions.push(`${column} NOT IN (${formattedValues})`);
        return this;
    }
    neq(column, value, status = true) {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} != ${formattedValue}`);
        return this;
    }
    leftJoin(table1, column1, table2, column2) {
        this.query += ` LEFT JOIN ${table2} ON ${table1}.${column1} = ${table2}.${column2}`;
        return this;
    }
    rightJoin(table1, column1, table2, column2) {
        this.query += ` RIGHT JOIN ${table2} ON ${table1}.${column1} = ${table2}.${column2}`;
        return this;
    }
    orderBy(column, direction = "ASC") {
        this.orderby.push(`${column} ${direction}`);
        return this;
    }
    range(start, end) {
        this.limit = end - start + 1;
        this.offset = start;
        return this;
    }
    reset() {
        this.query = "";
        this.conditions = [];
        this.operation = "";
        this.orderby = [];
        this.limit = null;
        this.offset = null;
        this.whereinsert = "";
        this.returnvalue = {
            query: "",
            condition: "",
            tablename: "",
            key: "",
            event: "",
        };
    }
    async build() {
        try {
            if (this.conditions.length > 0) {
                this.query += ` WHERE ${this.conditions.join(" AND ")}`;
                this.returnvalue.condition = `SELECT * FROM ${this.returnvalue.tablename} WHERE ${this.conditions.join(" AND ")}  `;
            }
            if (this.groupby.length > 0) {
                this.query += ` GROUP BY ${this.groupby.join(", ")}`; // Add GROUP BY clause
            }
            if (this.orderby.length > 0) {
                this.query += ` ORDER BY ${this.orderby.join(", ")}`;
            }
            if (this.limit !== null) {
                this.query += ` LIMIT ${this.limit}`;
            }
            if (this.offset !== null) {
                this.query += ` OFFSET ${this.offset}`;
            }
            if (this.returnvalue.event === "INSERT" ||
                this.returnvalue.event === "UPSERT") {
                this.returnvalue.condition =
                    `SELECT * FROM ${this.returnvalue.tablename} WHERE ` +
                        this.whereinsert;
            }
            this.returnvalue.query = this.query;
            return Query(this.returnvalue);
        }
        catch (e) {
            console.log(e);
        }
        finally {
            this.reset();
        }
    }
}
const Query = async (data) => {
    try {
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
        console.warn("System event :", event, " -- tablename :", tablename);
        return {
            data: result,
            error: "",
        };
    }
    catch (err) {
        console.log(err);
        return {
            data: [],
            error: err.message || "Internal Server Error",
        };
    }
};
const MysqlDatabase = () => new Mysqldatabase();
export default MysqlDatabase;
