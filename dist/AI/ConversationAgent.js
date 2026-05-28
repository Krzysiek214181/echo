import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";
export class ConversationAgent extends BaseAgent {
    constructor(MediaAgent, GoogleAgent, DailyBriefService) {
        super();
        this.MediaAgent = MediaAgent;
        this.GoogleAgent = GoogleAgent;
        this.DailyBriefService = DailyBriefService;
        this.model = "gpt-4o";
        this.toolDefinitions = router_tools;
        this.systemPrompt = conversationPrompt;
        this.tools = {
            'mediaAgent': { type: ToolResponseType.AGENT, handler: async (args) => this.MediaAgent.run([{ role: 'user', content: args.message }]) },
            'googleAgent': { type: ToolResponseType.AGENT, handler: async (args) => this.GoogleAgent.run([{ role: 'user', content: args.message }]) },
            'getCurrentDateTime': { type: ToolResponseType.CONTEXT, handler: () => new Date().toLocaleString() },
            'clearSession': { type: ToolResponseType.FINAL, handler: async (args) => { } }, //TODO: implement session clearing
            'getDailyBriefPrompt': { type: ToolResponseType.FINAL, handler: async (args) => this.DailyBriefService.generateDailyBriefPrompt() }
        };
    }
    ;
}
;
