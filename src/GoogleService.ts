import { calendar_v3, gmail_v1, google } from 'googleapis';
import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';

import { log, logError, __dirname } from './app.js';

export class GoogleService  {
    private tokenPath = path.join(__dirname, ".googleToken.json");
    private oAuth2Client;
    public calendar!: calendar_v3.Calendar
    public gmail!: gmail_v1.Gmail

    constructor(private clientId: string, private clientSecret: string,private redirectUri: string){
        this.oAuth2Client = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
            this.redirectUri
        );
    };

    async init(){
        try{
            const tokenData = await fs.readFile(this.tokenPath, 'utf-8');
            const token = JSON.parse(tokenData);
            this.oAuth2Client.setCredentials(token);
            log(`Google authenticated successfully with saved token`);
        }catch(err){
            await this.getNewToken();
        };

        this.calendar = google.calendar({version: 'v3', auth: this.oAuth2Client});
        this.gmail = google.gmail({version: 'v1', auth: this.oAuth2Client})
    };

    async getNewToken(){
        try{
            const scopes = [
                'https://www.googleapis.com/auth/calendar.events',
                'https://mail.google.com/'
            ];

            const authUrl = this.oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: scopes
            });

            console.log(`authorize google here: ${authUrl}`);

            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const code: string = await new Promise((resolve) => {
                rl.question('Enter the code: ', (answer) => {
                    rl.close();
                    resolve(answer.trim());
                });
            });

            const { tokens } = await this.oAuth2Client.getToken(code);
            this.oAuth2Client.setCredentials(tokens);

            await fs.writeFile(this.tokenPath, JSON.stringify(tokens));
            log(`Google authenticated successfully, token saved to .googleToken.json`);
        }catch(error){
            logError(error, "error while authenticating google, check error_log.txt");
        };
    };
};
