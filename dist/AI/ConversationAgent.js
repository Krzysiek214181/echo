import { BaseAgent } from "./BaseAgent.js";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";
export class ConversationAgent extends BaseAgent {
    constructor(MediaAgent, GoogleAgent) {
        super();
        this.MediaAgent = MediaAgent;
        this.GoogleAgent = GoogleAgent;
        this.model = "gpt-4o";
        this.toolDefinitions = router_tools;
        this.systemPrompt = conversationPrompt;
        this.tools = {
            'mediaAgent': async (args) => this.MediaAgent.run([{ role: 'user', content: args.message }]),
            'googleAgent': async (args) => this.GoogleAgent.run([{ role: 'user', content: args.message }]),
            'clearSession': async (args) => { } //TODO: implement session clearing
        };
    }
    ;
}
;
