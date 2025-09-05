import { calendar_v3, gmail_v1, google } from 'googleapis';
import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';

import { log, logError, __dirname } from './utilities.js';

type ParsedEvent = {
    title: string;
    start?: string;
    end?: string;
};
type CalendarType = "private" | "shared" | "all";

export class GoogleService  {
    private tokenPath = path.join(__dirname, "tokens", ".googleToken.json");
    private oAuth2Client;
    private scopes: string[] = ['https://www.googleapis.com/auth/calendar.events','https://mail.google.com/'];
    public calendar!: calendar_v3.Calendar
    public gmail!: gmail_v1.Gmail

    constructor(private clientId: string, private clientSecret: string,private redirectUri: string, private sharedCalendarID: string, private timezone: string){
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

    private async getNewToken(){
        try{
            const authUrl = this.oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: this.scopes,
                prompt: "consent"
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

    //check events for dayAmount number of days staring from startDate
    async getCalendarEvents(calendarType: CalendarType, startDate: Date = new Date(), dayAmount: number = 1){
        try{
            let calendarIDs = [];
            let includeDates = false;
            
            switch (calendarType) {
                case "private":
                    calendarIDs.push('primary');
                    break;
                case "shared":
                    calendarIDs.push(this.sharedCalendarID);
                    break;
                case "all":
                    calendarIDs.push('primary');
                    calendarIDs.push(this.sharedCalendarID);
                    break;
            };

            if(dayAmount > 1) includeDates = true
            
            const startTime = new Date();
            startTime.setDate(startDate.getDate());
            startTime.setHours(0, 0, 0, 0);
            const endTime = new Date();
            endTime.setDate(startDate.getDate() + dayAmount);
            endTime.setHours(0,0,0,0);

            const events: calendar_v3.Schema$Event[] = []
            await Promise.all(calendarIDs.map(async (calendarID) => {
                const calendarEvents =  await this.calendar.events.list({
                    calendarId: calendarID,
                    timeMin: startTime.toISOString(),
                    timeMax: endTime.toISOString(),
                    maxResults: 50,
                    singleEvents: true,
                    orderBy: 'startTime',
                    timeZone: this.timezone,
                });

                if(calendarEvents.data.items) events.push(...calendarEvents.data.items);
            }));

            return JSON.stringify(this.parseCalendarEvents(events || [], includeDates));
        }catch(error){
            logError(error, "error while fetching calendar events, check error_log.txt");
            return "error while fetching calendar events";
        };
    };

    //creates event in the corresponding calendar, if fullDay is false, duration is in hours, if true, in days
    async createCalendarEvent(calendarType: Exclude<CalendarType, "all">, title: string, startDate: Date, fullDay = false, duration?: number){
        try{
            let calendarID: string = "";
            let start: calendar_v3.Schema$EventDateTime = {timeZone: this.timezone};
            let end: calendar_v3.Schema$EventDateTime = {timeZone: this.timezone};

            switch (calendarType) {
                case "private":
                    calendarID = 'primary';
                    break;
                case "shared":
                    calendarID = this.sharedCalendarID;
                    break;
            };
            
            if(!duration) return "missing event duration";

            if(!fullDay){
                const startTime = new Date();
                startTime.setDate(startDate.getDate());
                start.dateTime = startTime.toISOString();

                const endTime = new Date()
                endTime.setDate(startDate.getDate());
                endTime.setHours(endTime.getHours() + duration);
                end.dateTime = endTime.toISOString();
            }else{
                const startingDate = new Date();
                startingDate.setDate(startDate.getDate());
                start.date = startingDate.toISOString().split("T")[0]
                const endingDate = new Date();
                endingDate.setDate(startDate.getDate() + duration);
                end.date = endingDate.toISOString().split("T")[0]
            };
            
            const eventObject: calendar_v3.Schema$Event = {
                "kind": "calendar#event",
                "summary": title,
                "start": start,
                "end": end,
            };

            await this.calendar.events.insert({
                calendarId: calendarID,
                requestBody: eventObject
            });
            return "event created succesfully";
        }catch(error){
            logError(error, "error while creating calendar event, check error_log.txt");
            return "error while creating event";
        };
    };

    //get the id, from and subject of quantity latest mails
    async getMail(quantity: number){
        try{
            const response = await this.gmail.users.messages.list({
                userId: "me",
                maxResults: quantity,
                q: "is:unread"
            });

            if (!response.data.messages) return "error while getting messages";

            const parsedMails = await Promise.all(response.data.messages.map(async (message) => {
                if (!message.id) {
                    logError("error while getting mail, no id found", "error while getting mail, no id found");
                    return;
                };

                const id = message.id;

                const mail = await this.gmail.users.messages.get({
                    userId: "me",
                    id: id,
                    format: "metadata"
                });

                if (!mail.data.payload?.headers) {
                    logError("error while getting mail, no headers found", "error while getting mail, no headers found");
                    return;
                };

                return this.parseMailMessage(mail.data.payload?.headers, id);
            }));

            return parsedMails;
        }catch(error){
            logError(error);
        };
    };

    async getFullMail(id: string){
        try{
            const response = await this.gmail.users.messages.get({
                userId: "me",
                id: id,
                format: "full"
            });

            if(!response.data.payload?.parts){
                logError("error while retrieving full mail, no data.parts", "error while retrieving full mail, no data.parts");
                return "error while retrieving mail";
            };
            
            const part = response.data?.payload?.parts[0];
            
            if(!part.body?.data){
                logError("error while retrieving full mail, no part.body", "error while retrieving full mail, no part.body");
                return "error while retrieving mail";
            };

            const data = part.body.data;
            const base64 = data.replace(/-/g, "+").replace(/_/g, "/")
            return Buffer.from(base64, "base64").toString('utf-8');
        }catch(error){
            logError(error, "error while retrieving full mail, check error_log.txt");
        }
    };

    //helper function for getCalendarEvents()
    private parseCalendarEvents(events: calendar_v3.Schema$Event[], includeDates = false){
        const parsedEvents = events.map((event) =>{
            const parsedEvent: ParsedEvent = {
                title: event.summary as string
            };

            if(event.start?.dateTime && event.end?.dateTime){
                parsedEvent.start = event.start.dateTime;
                parsedEvent.end = event.end?.dateTime;
            }else if(includeDates && event.start?.date && event.end?.date){
                parsedEvent.start = event.start?.date;
                parsedEvent.end = event.end?.date;
            };

            return parsedEvent;
        });
        return parsedEvents;
    };

    private parseMailMessage(headersData: gmail_v1.Schema$MessagePartHeader[], id: string){
        const subject = headersData.find(h => h.name === "Subject")?.value;
        const from = headersData.find(h => h.name === "From")?.value;

        return {
            id: id,
            from: from,
            subject: subject
        };
    };
};
