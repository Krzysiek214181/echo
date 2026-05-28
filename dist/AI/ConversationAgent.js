import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";
export class ConversationAgent extends BaseAgent {
    MediaAgent;
    GoogleAgent;
    DailyBrief;
    model = "gpt-4o";
    toolDefinitions = router_tools;
    systemPrompt = conversationPrompt;
    constructor(MediaAgent, GoogleAgent, DailyBrief) {
        super();
        this.MediaAgent = MediaAgent;
        this.GoogleAgent = GoogleAgent;
        this.DailyBrief = DailyBrief;
    }
    ;
    tools = {
        'mediaAgent': { type: ToolResponseType.AGENT, handler: async (args) => this.MediaAgent.run([{ role: 'user', content: args.message }]) },
        'googleAgent': { type: ToolResponseType.AGENT, handler: async (args) => this.GoogleAgent.run([{ role: 'user', content: args.message }]) },
        'getCurrentDateTime': { type: ToolResponseType.CONTEXT, handler: () => new Date().toLocaleString() },
        'clearSession': { type: ToolResponseType.FINAL, handler: async (args) => { } }, //TODO: implement session clearing
        'getDailyBrief': { type: ToolResponseType.FINAL, handler: async (args) => this.DailyBrief.generateDailyBrief() }
    };
}
;
