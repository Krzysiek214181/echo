import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
export const __dirname = path.dirname(__filename);

//function to access .env variables with Error handlig
export function getEnvVar(name: string): string {
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

export async function ensureDirectory(dirname: string){
    try{
        await fs.stat(path.join(__dirname, dirname));
        log(`Directory '${dirname}' exists, continuing...`);
    }catch( error: any ){
        if (error.code == 'ENOENT'){
            await fs.mkdir(path.join(__dirname, dirname));
            log(`Directory '${dirname}' created, continuing...`);
        }else{
            logError(error);
        };
    };
}