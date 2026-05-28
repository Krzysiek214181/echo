import { BaseAgent, ToolResponseType, ToolHandler } from "./BaseAgent.js";
import { GoogleAgent } from "./GoogleAgent";
import { MediaAgent } from "./MediaAgent";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";
import { DailyBriefService } from '../Services/DailyBriefService.js'

export class ConversationAgent extends BaseAgent{
    protected model = "gpt-4o";
    protected toolDefinitions = router_tools;
    protected systemPrompt = conversationPrompt;
    
    constructor(private MediaAgent: MediaAgent, private GoogleAgent: GoogleAgent, private DailyBriefService: DailyBriefService){
        super();
    };

    protected tools = {
        'mediaAgent': {type: ToolResponseType.AGENT, handler: async (args: any) => this.MediaAgent.run([{role: 'user', content: args.message}])},
        'googleAgent': {type: ToolResponseType.AGENT, handler: async (args: any) => this.GoogleAgent.run([{role: 'user', content: args.message}])},
        'getCurrentDateTime': {type: ToolResponseType.CONTEXT, handler: () => new Date().toLocaleString()},
        'clearSession': {type: ToolResponseType.FINAL, handler: async (args: any) => {}}, //TODO: implement session clearing
        'getDailyBriefPrompt': {type: ToolResponseType.FINAL, handler: async (args: any) => this.DailyBriefService.generateDailyBriefPrompt()}
    };
};