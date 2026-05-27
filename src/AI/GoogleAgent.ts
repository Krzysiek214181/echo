import { BaseAgent } from "./BaseAgent.js";
import { GoogleService } from "../Services/GoogleService.js";
import { google_tools } from "./toolDefinitions.js";
import { googlePrompt } from "./prompts.js";

export class GoogleAgent extends BaseAgent{
    protected model = 'gpt-5-nano';
    protected toolDefinitions = google_tools;
    protected systemPrompt = googlePrompt;

    constructor(private googleService: GoogleService){
        super();
    };
    
    protected tools = {
        'getCalendarEvents': (args: any) => this.googleService.getCalendarEvents(args.calendarType, new Date(args.startDate), args.dayAmount),
        'createCalendarEvent': (args: any) => this.googleService.createCalendarEvent(args.calendarType, args.title, new Date(args.start), args.fullDay, args.duration),
        'deleteCalendarEvent': (args: any) => this.googleService.deleteCalendarEvent(args.id),
        'getMail': (args: any) => this.googleService.getMail(args.quantity),
        'getFullMail': (args: any) => this.googleService.getFullMail(args.id),
        'createMailDraft': (args: any) => this.googleService.createMailDraft(args.to, args.subject, args.message),
        'sendMailDraft': (args: any) => this.googleService.sendMailDraft(args.id),
        'getCurrentDateTime': () => new Date().toISOString()
    };
};