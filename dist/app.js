import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { getEnvVar, logError, log, __dirname } from "./utilities.js";
import { GoogleService } from "./GoogleService.js";
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
const _PORT = getEnvVar("PORT");
const _TIMEZONE = getEnvVar("TIMEZONE");
getEnvVar("OPENAI_API_KEY");
const GOOGLE_CLIENT_ID = getEnvVar("GOOGLE_CLIENT_ID");
const GOOGLE_CLIENT_SECRET = getEnvVar("GOOGLE_CLIENT_SECRET");
const GOOGLE_REDIRECT = getEnvVar("GOOGLE_REDIRECT");
const GOOGLE_SHARED_CALENDAR_ID = getEnvVar("GOOGLE_SHARED_CALENDAR_ID");
// #endregion
const app = express();
app.use(express.json());
app.get("/googleAuth", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "googleAuth.html"));
});
app.listen(_PORT, () => {
    log(`listening on port ${_PORT}`);
});
const googleService = new GoogleService(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT, GOOGLE_SHARED_CALENDAR_ID, _TIMEZONE);
await googleService.init();
