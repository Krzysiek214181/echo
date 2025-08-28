import dotenv from "dotenv";
import express from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config({quiet: true});
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// #region ensure/create logs folder & unhandled error logging
try{
    await fs.stat(path.join(__dirname, "logs"));
    log(`Directory 'logs' exists, continuing...`);
}catch( error: any ){
    if (error.code == 'ENOENT'){
        await fs.mkdir(path.join(__dirname, "logs"));
        log(`Directory 'logs' created, continuing...`);
    }else{
        logError(error);
    };
};

process.on('uncaughtException', async (error)=>{
    await logError(error, "unhandled exception error, check error_log.txt");
    process.exit(1);
});
process.on('unhandledRejection', async (error)=>{
    await logError(error, "unhandled rejection error, check error_log.txt");
    process.exit(1);
});
// #endregion

// #region laod environmental variables
    const _PORT = getEnvVar("PORT");
// #endregion

const app = express();

app.use(express.json());

app.listen(_PORT, ()=>{
    log(`listening on port ${_PORT}`);
});

//function to access .env variables with Error handlig
function getEnvVar(name: string): string {
    const value = process.env[name];
    if(!value) throw new Error(`Environment varable ${name} is missing`);
    return value;
};

//log to logs/log.txt and console - use instead of console.log()
export async function log(content: string, isError = false){
    try{
        let logContent = "";
        if(isError){ logContent += "[ERROR] ";}
        else{ 
            logContent += "[INFO]  ";
            console.log(content);
        };
        logContent += `[${new Date().toISOString()}] ${content}\n`
        await fs.appendFile(path.join(__dirname, "logs", "log.txt"), logContent, { flag: 'a+' });
    } catch (error) {
        logError(error);
    };
};

//log to logs/error_log.txt and console, optionally logs logMessage to logs/log.txt
export async function logError(error: any, logMessage?: string){
    const errorMessage = `${new Date().toISOString()} - ${error.stack || error}\n`;
    try{
        await fs.appendFile(path.join(__dirname, "logs", "error_log.txt"), errorMessage, { flag: 'a+'});

        if(logMessage){await log(logMessage, true);}
        else{ await log(error, true);};

        console.error(errorMessage);
    }catch(error){
        console.error(`Failed to write to error log: ${error}`);
    };
};