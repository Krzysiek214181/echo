import { calendar_v3, gmail_v1, google } from 'googleapis';
import path from 'path';
import fs from 'fs/promises';
import readline from 'readline';

import { log, logError, __dirname } from '../utilities.js';

export type ParsedEvent = {
    id: string;
    iCalUID?: string;
    title: string;
    start?: string;
    end?: string;
};
export type CalendarType = "private" | "shared" | "all";

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
    async getCalendarEvents(calendarType: CalendarType, startDate: Date = new Date(), dayAmount: number = 1): Promise<string>{
        try{
            let calendarIDs = [];
            
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

            return JSON.stringify(this.parseCalendarEvents(events || []));
        }catch(error){
            logError(error, "error while fetching calendar events, check error_log.txt");
            return "error while fetching calendar events";
        };
    };

    //creates event in the corresponding calendar, if fullDay is false, duration is in minutes, if true, in days
    async createCalendarEvent(calendarType: Exclude<CalendarType, "all">, title: string, startDate: Date, fullDay = false, duration?: number): Promise<string>{
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
                startTime.setTime(startDate.getTime());
                start.dateTime = startTime.toISOString();

                const endTime = new Date()
                endTime.setDate(startDate.getDate());
                endTime.setTime(startDate.getTime() + (duration * 60 * 1000));
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

            log(`New calendar event created:
    calendarType: ${calendarType}
    title: ${title}
    start: ${start.dateTime || start.date}
    end: ${end.dateTime || end.date}
    fullDay: ${fullDay}
    duration: ${duration}${fullDay ? " days" : " min"}`);

            return "event created succesfully";
        }catch(error){
            logError(error, "error while creating calendar event, check error_log.txt");
            return "error while creating event";
        };
    };

    //deletes an event by id from the corresponding calendar
   async deleteCalendarEvent(id: string): Promise<string> {
           const eventsToDelete = [];
           try {
               for (const calendarID of ['primary', this.sharedCalendarID]) {
                   try{
                       const event = await this.calendar.events.get({
                           calendarId: calendarID,
                           eventId: id
                       });
                       if (event) eventsToDelete.push({event: event.data, calendarID: calendarID});
                   }catch(error){}; // the not found error is expected here
               }
               if (eventsToDelete.length > 1 || eventsToDelete.length === 0) {
                   return "cannot delete event, event not found or multiple events with the same id found";
               }
               else {
                   await this.calendar.events.delete({
                       calendarId: eventsToDelete[0].calendarID,
                       eventId: id
                   });
                   log(`Calendar event deleted: 
    id: ${id}
    calendarID: ${eventsToDelete[0].calendarID}
    title: ${eventsToDelete[0].event.summary}`);
                   return "event deleted successfully";
               };
           }
           catch (error) {
               logError(error, "error while deleting calendar event, check error_log.txt");
                return "error while deleting event";
           };
    };

    //get the id, from and subject of quantity latest mails
    async getMail(quantity: number = 10): Promise<string | Record<string, any>[]> {
        try{
            const response = await this.gmail.users.messages.list({
                userId: "me",
                maxResults: quantity,
                q: "is:unread category:primary"
            });

            if (!response.data.messages){
                logError("error while getting mail, no messages found", "error while getting mail, no messages found");
                return "error while getting mail, no messages found";
            }

            const parsedMails = await Promise.all(response.data.messages.map(async (message) => {
                if (!message.id) {
                    logError("error while getting mail, no id found", "error while getting mail, no id found");
                    return {}
                };

                const id = message.id;

                const mail = await this.gmail.users.messages.get({
                    userId: "me",
                    id: id,
                    format: "metadata"
                });

                if (!mail.data.payload?.headers) {
                    logError("error while getting mail, no headers found", "error while getting mail, no headers found");
                    return {}
                };

                return this.parseMailMessage(mail.data.payload?.headers, id);
            }));

            return parsedMails;
        }catch(error){
            logError(error);
            return "error while getting mail, check error_log.txt";
        };
    };

    //get the full contents of a mail by id
    async getFullMail(id: string): Promise<string> {
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
            return "error while retrieving mail";
        }
    };

    //creates a draft on an email, return the draft id
    async createMailDraft(to: string, subject: string, message: string): Promise<string> {
       try{
            const messageParts = [
                "To: " + to,
                "Subject: " + subject,
                "Mime-Version: 1.0",
                "Content-Type: text/plain; charset=utf-8",
                "",
                message
            ];

            const joinedMessage = messageParts.join("\n");

            const encodedMessage = Buffer.from(joinedMessage).toString("base64").replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

            const response = await this.gmail.users.drafts.create({
                userId: "me",
                requestBody: {
                    message: {
                        raw: encodedMessage
                    }
                }
            });
            return response.data.id ?? "error while creating mail draft, no id returned";
        }catch(error){
            logError(error, "error while creating mail draft, check error_log.txt");
            return "error while creating mail draft";
        }
    };

    //sends a draft email by id
    async sendMailDraft(id: string): Promise<string>{
        try{
            const response = await this.gmail.users.drafts.send({
                userId: "me",
                requestBody: {
                    id: id
                }});
            return "mail draft sent successfully";
        }catch(error){
            logError(error, "error while sending mail draft, check error_log.txt");
            return "error while sending mail draft";
        }
    };

    //helper function for getCalendarEvents()
    private parseCalendarEvents(events: calendar_v3.Schema$Event[]): ParsedEvent[]{
        const parsedEvents = events.map((event) =>{
            const parsedEvent: ParsedEvent = {
                id: event.id as string,
                title: event.summary as string
            };

            if(event.start?.dateTime && event.end?.dateTime){``
                parsedEvent.start = event.start.dateTime;
                parsedEvent.end = event.end?.dateTime;
            }else if(event.start?.date && event.end?.date){
                parsedEvent.start = event.start?.date;
                const [endYear, endMonth, endDay] = event.end.date.split("-");
                parsedEvent.end = `${endYear}-${endMonth}-${Number(endDay) - 1}`; // subtract 1 from end date because full day events end at 00:00 of the next day
            };

            return parsedEvent;
        });
        return parsedEvents;
    };

    private parseMailMessage(headersData: gmail_v1.Schema$MessagePartHeader[], id: string){
        const dateHeader = headersData.find(h => h.name === "Date")?.value
        const subject = headersData.find(h => h.name === "Subject")?.value;
        const from = headersData.find(h => h.name === "From")?.value;
        if(dateHeader){
            const date = new Date(dateHeader).toLocaleString();
            return {
                id: id,
                from: from,
                subject: subject,
                date: date
            };
        };

        return {
            id: id,
            from: from,
            subject: subject
        };
    };
};
