import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { getEnvVar, logError, log, __dirname } from "./utilities.js";
import { GoogleService } from "./GoogleService.js";
import { SpotifyService } from "./SpotifyService.js";
dotenv.config({ quiet: true });
// #region ensure/create logs folder & unhandled error logging
try {
    await fs.stat(path.join(__dirname, "logs"));
    log(`Directory 'logs' exists, continuing...`);
}
catch (error) {
    if (error.code == 'ENOENT') {
        await fs.mkdir(path.join(__dirname, "logs"));
        log(`Directory 'logs' created, continuing...`);
    }
    else {
        logError(error);
    }
    ;
}
;
process.on('uncaughtException', async (error) => {
    await logError(error, "unhandled exception error, check error_log.txt");
    process.exit(1);
});
process.on('unhandledRejection', async (error) => {
    await logError(error, "unhandled rejection error, check error_log.txt");
    process.exit(1);
});
// #endregion
// #region laod environmental variables
export const _PORT = getEnvVar("PORT");
const _TIMEZONE = getEnvVar("TIMEZONE");
getEnvVar("OPENAI_API_KEY");
const GOOGLE_CLIENT_ID = getEnvVar("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getEnvVar("GOOGLE_CLIENT_SECRET");
const GOOGLE_REDIRECT = getEnvVar("GOOGLE_REDIRECT");
const GOOGLE_SHARED_CALENDAR_ID = getEnvVar("GOOGLE_SHARED_CALENDAR_ID");
const SPOTIFY_CLIENT_ID = getEnvVar("SPOTIFY_CLIENT_ID");
const SPOTIFY_CLIENT_SECRET = getEnvVar("SPOTIFY_CLIENT_SECRET");
const SPOTIFY_REDIRECT = getEnvVar("SPOTIFY_REDIRECT");
// #endregion
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
const spotifyService = new SpotifyService(SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT);
await spotifyService.init();
