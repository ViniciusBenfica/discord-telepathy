import express, { type Request, type Response } from "express";
import { Bot } from "./commands/bot.js";

const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req: Request, res: Response) => {
	res.send("Bot is running!");
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});

const bot = new Bot();
bot.start();
