import { BaseAgent, ToolResponseType, ToolHandler } from "./BaseAgent.js";
import { GoogleAgent } from "./GoogleAgent";
import { MediaAgent } from "./MediaAgent";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";
import { DailyBrief as DailyBrief } from './DailyBrief.js'

export class ConversationAgent extends BaseAgent{
    protected model = "gpt-4o";
    protected toolDefinitions = router_tools;
    protected systemPrompt = conversationPrompt;
    
    constructor(private MediaAgent: MediaAgent, private GoogleAgent: GoogleAgent, private DailyBrief: DailyBrief){
        super();
    };

    protected tools = {
        'mediaAgent': {type: ToolResponseType.AGENT, handler: async (args: any) => this.MediaAgent.run([{role: 'user', content: args.message}])},
        'googleAgent': {type: ToolResponseType.AGENT, handler: async (args: any) => this.GoogleAgent.run([{role: 'user', content: args.message}])},
        'getCurrentDateTime': {type: ToolResponseType.CONTEXT, handler: () => new Date().toLocaleString()},
        'clearSession': {type: ToolResponseType.FINAL, handler: async (args: any) => {}}, //TODO: implement session clearing
        'getDailyBrief': {type: ToolResponseType.FINAL, handler: async (args: any) => this.DailyBrief.generateDailyBrief()}
    };
};