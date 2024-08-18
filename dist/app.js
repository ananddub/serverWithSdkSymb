import express from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { SocketSymb, Symb } from "./routes/QueryReply.js";
import JWTService from "./controllers/JwtSign.js";
dotenv.config({ path: "./.env" });
export const envMode = process.env.NODE_ENV?.trim() || "DEVELOPMENT";
const port = process.env.PORT || 3000;
const app = express();
const httpServer = createServer(app);
export const io = new Server(httpServer, {
    cors: {
        origin: "*",
        credentials: true,
    },
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: " * ", credentials: true }));
app.use(morgan("dev"));
app.get("/", async (req, res) => {
    res.send("Hello, World!");
});
app.get("*", (req, res) => {
    res.status(404).json({
        success: false,
        message: "Page not found",
    });
});
app.post("/login", async (req, res) => {
    const { token, id } = req.body;
    const value = await JWTService().setToken(token).setUserId(id).verifyJwt();
    return res.send({
        status: value,
    });
});
app.post("/newlogin", async (req, res) => {
    const { id } = req.body;
    console.log(req.body);
    const token = (await JWTService().setUserId(id).createJwt().updateJwt()).getToken();
    console.log({ token: token });
    return res.send({
        token: token,
    });
});
app.post("/symb", Symb);
io.on("connection", SocketSymb);
httpServer.listen(port, () => console.dir("Server is working on Port:" + port + " in " + envMode + " Mode."));
