import { BaseAgent } from "./BaseAgent.js";
import { google_tools } from "./toolDefinitions.js";
import { googlePrompt } from "./prompts.js";
export class GoogleAgent extends BaseAgent {
    constructor(googleService) {
        super();
        this.googleService = googleService;
        this.model = 'gpt-4o';
        this.toolDefinitions = google_tools;
        this.systemPrompt = googlePrompt;
        this.tools = {
            'getCalendarEvents': (args) => this.googleService.getCalendarEvents(args.calendarType, args.startDate, args.dayAmount),
            'createCalendarEvent': (args) => this.googleService.createCalendarEvent(args.calendarType, args.title, args.startDate, args.fullDay, args.duration),
            'deleteCalendarEvent': (args) => this.googleService.deleteCalendarEvent(args.id),
            'getMail': (args) => this.googleService.getMail(args.quantity),
            'getFullMail': (args) => this.googleService.getFullMail(args.id),
            'createMailDraft': (args) => this.googleService.createMailDraft(args.to, args.subject, args.message),
            'sendMailDraft': (args) => this.googleService.sendMailDraft(args.id)
        };
    }
    ;
}
;
