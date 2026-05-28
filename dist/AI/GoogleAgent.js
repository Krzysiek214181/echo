import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { google_tools } from "./toolDefinitions.js";
import { googlePrompt } from "./prompts.js";
export class GoogleAgent extends BaseAgent {
    googleService;
    model = 'gpt-5-nano';
    toolDefinitions = google_tools;
    systemPrompt = googlePrompt;
    constructor(googleService) {
        super();
        this.googleService = googleService;
    }
    ;
    tools = {
        'getCalendarEvents': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.getCalendarEvents(args.calendarType, new Date(args.startDate), args.dayAmount) },
        'createCalendarEvent': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.createCalendarEvent(args.calendarType, args.title, new Date(args.start), args.fullDay, args.duration) },
        'deleteCalendarEvent': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.deleteCalendarEvent(args.id) },
        'getMail': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.getMail(args.quantity) },
        'getFullMail': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.getFullMail(args.id) },
        'createMailDraft': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.createMailDraft(args.to, args.subject, args.message) },
        'sendMailDraft': { type: ToolResponseType.CONTEXT, handler: (args) => this.googleService.sendMailDraft(args.id) },
        'getCurrentDateTime': { type: ToolResponseType.CONTEXT, handler: () => new Date().toLocaleString() }
    };
}
;
