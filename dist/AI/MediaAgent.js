import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { media_tools } from "./toolDefinitions.js";
import { mediaPrompt } from "./prompts.js";
export class MediaAgent extends BaseAgent {
    constructor(spotifyService) {
        super();
        this.spotifyService = spotifyService;
        this.model = 'gpt-5-nano';
        this.toolDefinitions = media_tools;
        this.systemPrompt = mediaPrompt;
        this.tools = {
            'play': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.play(args.query, args.type) },
            'pause': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.pause() },
            'skip': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.skip(args.type) },
            'addtoQueue': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.addtoQueue(args.query) },
            'toggleShuffle': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.toggleShuffle(args.state) },
            'search': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.search(args.query, args.type, args.limit) }
        };
    }
    ;
}
;
