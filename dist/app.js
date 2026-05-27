import dotenv from "dotenv";
import express from "express";
import path from "path";
import { OpenAI } from "openai";
import readline from 'readline';
dotenv.config({ quiet: true });
import { getEnvVar, logError, log, __dirname, ensureDirectory } from "./utilities.js";
import { GoogleService } from "./Services/GoogleService.js";
import { SpotifyService } from "./Services/SpotifyService.js";
import { ConversationAgent } from "./AI/ConversationAgent.js";
import { DailyBriefService } from "./Services/DailyBriefService.js";
import { GoogleAgent } from "./AI/GoogleAgent.js";
import { MediaAgent } from "./AI/MediaAgent.js";
import { AgentCodes } from "./AI/BaseAgent.js";
// #region ensure/create required dirs & unhandled error logging
await ensureDirectory("logs");
await ensureDirectory("tokens");
process.on('uncaughtException', async (error) => {
    await logError(error, "unhandled exception error, check error_log.txt");
    process.exit(1);
});
process.on('unhandledRejection', async (error) => {
    await logError(error, "unhandled rejection error, check error_log.txt");
    process.exit(1);
});
// #endregion
// #region load environmental variables
export const _PORT = getEnvVar("EXPRESS_PORT");
const _TIMEZONE = getEnvVar("TIMEZONE");
const OPENAI_API_KEY = getEnvVar("OPENAI_API_KEY");
const GOOGLE_CLIENT_ID = getEnvVar("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getEnvVar("GOOGLE_CLIENT_SECRET");
const GOOGLE_REDIRECT = getEnvVar("GOOGLE_REDIRECT");
const GOOGLE_SHARED_CALENDAR_ID = getEnvVar("GOOGLE_SHARED_CALENDAR_ID");
const SPOTIFY_CLIENT_ID = getEnvVar("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = getEnvVar("SPOTIFY_CLIENT_SECRET");
const SPOTIFY_REDIRECT = getEnvVar("SPOTIFY_REDIRECT");
const SPOTIFY_DEFAULT_DEVICE = process.env.SPOTIFY_DEFAULT_DEVICE; // not required
// #endregion
export const openai = new OpenAI({ apiKey: OPENAI_API_KEY }); // has to be created and exported here to avoid issues with .env loading
const app = express();
app.use(express.json());
app.get("/googleAuth", (req, res) => res.sendFile(path.join(__dirname, "public", "googleAuth.html")));
app.get("/spotifyAuth", (req, res) => spotifyService.handleCallback(req, res));
app.get("/authorizeSpotify", (req, res) => spotifyService.redirectLogin(req, res));
app.listen(_PORT, () => {
    log(`listening on port ${_PORT}`);
});
const googleService = new GoogleService(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT, GOOGLE_SHARED_CALENDAR_ID, _TIMEZONE);
await googleService.init();
const spotifyService = new SpotifyService(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT, SPOTIFY_DEFAULT_DEVICE);
await spotifyService.init();
const dailyBriefService = new DailyBriefService(googleService);
const googleAgent = new GoogleAgent(googleService);
const mediaAgent = new MediaAgent(spotifyService);
const conversationAgent = new ConversationAgent(mediaAgent, googleAgent, dailyBriefService);
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
let messages = [];
async function handlePrompt(prompt) {
    messages.push({ role: 'user', content: prompt });
    try {
        const response = await conversationAgent.run(messages);
        messages.push({ role: 'assistant', content: response });
        return response;
    }
    catch (error) {
        logError(error, "error while handling prompt");
        return;
    }
    ;
}
;
function ask() {
    rl.question('> ', async (input) => {
        if (input.toLowerCase() === "exit") {
            log("exiting...");
            rl.close();
            process.exit(0);
        }
        ;
        try {
            const response = await handlePrompt(input);
            if (response?.code === AgentCodes.ERROR) {
                log("there was an error handling the prompt, check error_log.txt for details");
            }
            else {
                messages = response?.content;
                log(messages?.[messages.length - 1].content[0].text);
            }
            ;
        }
        catch (error) {
            logError(error, "error while handling prompt");
        }
        ;
        ask();
    });
}
;
log("app started, waiting for prompt");
ask();
