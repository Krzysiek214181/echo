import { BaseAgent } from "./BaseAgent.js";
import { GoogleAgent } from "./GoogleAgent";
import { MediaAgent } from "./MediaAgent";
import { conversationPrompt } from "./prompts.js";
import { router_tools } from "./toolDefinitions.js";

export class ConversationAgent extends BaseAgent{
    protected model = "gpt-4o";
    protected toolDefinitions = router_tools;
    protected systemPrompt = conversationPrompt;
    
    constructor(private MediaAgent: MediaAgent, private GoogleAgent: GoogleAgent){
        super();
    };

    protected tools = {
        'mediaAgent': async (args: any) => this.MediaAgent.run([{role: 'user', content: args.message}]),
        'googleAgent': async (args: any) => this.GoogleAgent.run([{role: 'user', content: args.message}]),
        'getCurrentDateTime': () => new Date().toISOString(),
        'clearSession': async (args: any) => {}, //TODO: implement session clearing
    };
};