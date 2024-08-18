import jwt from "jsonwebtoken";
import MysqlDatabase from "../utils/Database.js";
class JwtService {
    constructor(tablename, column) {
        this.secretKey = this.generateRandomPassword(40);
        this.jwttoken = "";
        this.column = column;
        this.userid = "";
        this.tablename = tablename;
    }
    getToken() {
        return this.jwttoken;
    }
    setUserId(id) {
        this.userid = id;
        return this;
    }
    createJwt() {
        if (!this.userid) {
            throw new Error("User ID must be set before creating a JWT.");
        }
        this.jwttoken = jwt.sign({ userID: this.userid }, this.secretKey); // No expiration set
        return this;
    }
    createSecretKey() {
        this.secretKey = this.generateRandomPassword(40);
        return this;
    }
    async updateJwt() {
        if (!this.jwttoken || !this.userid) {
            throw new Error("JWT or User ID must be set before updating.");
        }
        try {
            const db = MysqlDatabase();
            const { data, error } = await db
                .from(this.tablename)
                .update({ jwt: this.secretKey })
                .eq(this.column, this.userid)
                .build();
            console.log("data and error ", data);
            console.log("data and error ", error);
            return this;
        }
        catch (error) {
            console.error("Error updating JWT:", error);
            throw error;
        }
    }
    setToken(token) {
        this.jwttoken = token;
        return this;
    }
    async verifyJwt() {
        try {
            const { data, error } = await MysqlDatabase()
                .select("*")
                .from(this.tablename)
                .eq(this.column, this.userid)
                .build();
            const decoded = jwt.verify(this.jwttoken, data[0].jwt);
            return { valid: true, decoded };
        }
        catch (err) {
            return { valid: false, error: err.message };
        }
    }
    generateRandomPassword(length) {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            password += characters[randomIndex];
        }
        return password;
    }
    async decodeJwt() {
        try {
            const db = MysqlDatabase();
            const { data, error } = await db
                .select("*")
                .from(this.tablename)
                .eq(this.column, this.userid)
                .build();
            this.setToken(data[0].jwt);
            return jwt.decode(data[0].jwt);
        }
        catch (err) {
            console.error("Error decoding JWT:", err);
            return null;
        }
    }
    isTokenExpired() {
        try {
            const decoded = this.decodeJwt(this.jwttoken);
            if (decoded && typeof decoded !== "string") {
                const exp = decoded.exp;
                return exp ? exp < Math.floor(Date.now() / 1000) : false;
            }
            return false;
        }
        catch (err) {
            console.error("Error checking token expiration:", err);
            return true; // Consider token expired if there's an error
        }
    }
}
const JWTService = () => {
    const secretKey = process.env.PASSWORD || "";
    return new JwtService("userlogin", "username");
};
export default JWTService;
