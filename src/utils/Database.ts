import exp from "constants";
import { DeleteRecord, InsertRecord, ReadRecord } from "./mysql.js";

class Mysqldatabase {
    private query: string = "";
    private conditions: string[] = [];
    private operation: string = "";
    private orderby: string[] = [];
    private limit: number | null = null;
    private offset: number | null = null;
    private socketurl: string = "";
    private groupby: string[] = [];
    private serverurl: string = "";
    private whereinsert: string = "";
    private socket: {
        tablename: string;
        channel: string;
    }[] = [];
    private returnvalue: {
        query: string;
        condition: string;
        tablename: string;
        key: any;
        event: string;
    } = {
        query: "",
        condition: "",
        tablename: "",
        event: "",
        key: "",
    };
    constructor(operation: string = "") {
        this.operation = operation;
    }
    groupBy(column: string): Mysqldatabase {
        this.groupby.push(column);
        return this;
    }
    select(columns: string = "*"): Mysqldatabase {
        this.query = `SELECT ${columns}`;
        this.returnvalue.event = "SELECT";
        return this;
    }

    from(table: string): Mysqldatabase {
        this.query += ` FROM ${table}`;
        this.returnvalue.tablename = table;
        return this;
    }

    insert(rows: Record<string, any>[]): Mysqldatabase {
        this.operation = "insert";

        // Collect all unique columns from rows
        const columnsSet = new Set<string>();
        rows.forEach((row) =>
            Object.keys(row).forEach((key) => columnsSet.add(key)),
        );
        const columns = Array.from(columnsSet).join(", ");
        const values = rows
            .map(
                (row) =>
                    `${Object.values(row)
                        .map((val) => `'${val}'`)
                        .join(", ")}`,
            )
            .join(", ");
        // Build the final query
        this.query = `INSERT INTO ${this.returnvalue.tablename} (${columns}) VALUES (${values})`;

        let c = 0;
        for (let x of rows) {
            const arr = Object.entries(x)[0];
            console.log(arr[0]);
            this.whereinsert += `${arr[0]}='${arr[1]}' `;
            if (c != rows.length - 1) this.whereinsert += `AND `;
            c++;
        }
        this.returnvalue.event = "INSERT";
        return this;
    }

    upsert(rows: Record<string, any>[]): Mysqldatabase {
        this.operation = "upsert";

        // Collect all unique columns from rows
        const columnsSet = new Set<string>();
        rows.forEach((row) =>
            Object.keys(row).forEach((key) => columnsSet.add(key)),
        );
        const columns = Array.from(columnsSet).join(", ");
        const values = rows
            .map(
                (row) =>
                    `${Object.values(row)
                        .map((val) => `'${val}'`)
                        .join(", ")}`,
            )
            .join(", ");
        // Build the final query
        this.query = `INSERT INTO ${this.returnvalue.tablename} (${columns}) VALUES ${values} ON CONFLICT DO NOTHING`;
        this.returnvalue.event = "INSERT";
        let c = 0;
        for (let x of rows) {
            const arr = Object.entries(x)[0];
            console.log(arr[0]);
            this.whereinsert += `${arr[0]}='${arr[1]}' `;
            if (c != rows.length - 1) this.whereinsert += `AND `;
            c++;
        }

        return this;
    }
    update(updateObj: object): Mysqldatabase {
        this.operation = "update";
        this.query = `UPDATE ${this.returnvalue.tablename} SET ${Object.entries(
            updateObj,
        )
            .map(([key, value]) => `${key} = '${value}'`)
            .join(", ")}`;
        this.returnvalue.event = "UPDATE";
        return this;
    }
    delete(): Mysqldatabase {
        this.operation = "delete";
        this.query = `DELETE  ${this.query}`;
        this.returnvalue.event = "DELETE";
        return this;
    }

    eq(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} = ${formattedValue}`);
        return this;
    }

    gt(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} > ${formattedValue}`);
        return this;
    }

    lt(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} < ${formattedValue}`);
        return this;
    }

    gte(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} >= ${formattedValue}`);
        return this;
    }

    lte(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} <= ${formattedValue}`);
        return this;
    }

    like(column: string, value: string, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} LIKE ${formattedValue}`);
        return this;
    }

    ilike(
        column: string,
        value: string,
        status: boolean = true,
    ): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} ILIKE ${formattedValue}`);
        return this;
    }

    is(column: string, value: any, status: boolean = true): Mysqldatabase {
        if (value === null) {
            this.conditions.push(`${column} IS NULL`);
        } else {
            const formattedValue = status ? `'${value}'` : `${value}`;
            this.conditions.push(`${column} IS ${formattedValue}`);
        }
        return this;
    }

    in(column: string, values: any[], status: boolean = true): Mysqldatabase {
        const formattedValues = values
            .map((val) => (status ? `'${val}'` : `${val}`))
            .join(", ");
        this.conditions.push(`${column} IN (${formattedValues})`);
        return this;
    }

    nin(column: string, values: any[], status: boolean = true): Mysqldatabase {
        const formattedValues = values
            .map((val) => (status ? `'${val}'` : `${val}`))
            .join(", ");
        this.conditions.push(`${column} NOT IN (${formattedValues})`);
        return this;
    }

    neq(column: string, value: any, status: boolean = true): Mysqldatabase {
        const formattedValue = status ? `'${value}'` : `${value}`;
        this.conditions.push(`${column} != ${formattedValue}`);
        return this;
    }

    leftJoin(
        table1: string,
        column1: string,
        table2: string,
        column2: string,
    ): Mysqldatabase {
        this.query += ` LEFT JOIN ${table2} ON ${table1}.${column1} = ${table2}.${column2}`;
        return this;
    }

    rightJoin(
        table1: string,
        column1: string,
        table2: string,
        column2: string,
    ): Mysqldatabase {
        this.query += ` RIGHT JOIN ${table2} ON ${table1}.${column1} = ${table2}.${column2}`;
        return this;
    }

    orderBy(column: string, direction: "ASC" | "DESC" = "ASC"): Mysqldatabase {
        this.orderby.push(`${column} ${direction}`);
        return this;
    }

    range(start: number, end: number): Mysqldatabase {
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
            if (
                this.returnvalue.event === "INSERT" ||
                this.returnvalue.event === "UPSERT"
            ) {
                this.returnvalue.condition =
                    `SELECT * FROM ${this.returnvalue.tablename} WHERE ` +
                    this.whereinsert;
            }
            this.returnvalue.query = this.query;
            return Query(this.returnvalue);
        } catch (e) {
            console.log(e);
        } finally {
            this.reset();
        }
    }
}

const Query = async (data: any) => {
    try {
        const { query, event, tablename, condition }: any = data;
        let result: any;
        if (event === "SELECT") {
            result = await ReadRecord(query);
        } else if (event === "DELETE") {
            result = await DeleteRecord(query, condition);
        } else {
            result = await InsertRecord(query, condition);
        }
        console.warn("System event :", event, " -- tablename :", tablename);
        return {
            data: result,
            error: "",
        };
    } catch (err: any) {
        console.log(err);
        return {
            data: [],
            error: err.message || "Internal Server Error",
        };
    }
};

const MysqlDatabase = () => new Mysqldatabase();
export default MysqlDatabase;
