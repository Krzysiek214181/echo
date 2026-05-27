import { BaseAgent } from "./BaseAgent.js";
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
            'mediaAgent': async (args) => this.MediaAgent.run([{ role: 'user', content: args.message }]),
            'googleAgent': async (args) => this.GoogleAgent.run([{ role: 'user', content: args.message }]),
            'getCurrentDateTime': () => new Date().toLocaleString(),
            'clearSession': async (args) => { }, //TODO: implement session clearing
            'getDailyBriefPrompt': async (args) => this.DailyBriefService.generateDailyBriefPrompt()
        };
    }
    ;
}
;
