import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { media_tools } from "./toolDefinitions.js";
import { mediaPrompt } from "./prompts.js";
export class MediaAgent extends BaseAgent {
    spotifyService;
    model = 'gpt-5-nano';
    toolDefinitions = media_tools;
    systemPrompt = mediaPrompt;
    constructor(spotifyService) {
        super();
        this.spotifyService = spotifyService;
    }
    ;
    tools = {
        'play': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.play(args.query, args.type) },
        'pause': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.pause() },
        'skip': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.skip(args.type) },
        'addtoQueue': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.addtoQueue(args.query) },
        'toggleShuffle': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.toggleShuffle(args.state) },
        'search': { type: ToolResponseType.CONTEXT, handler: async (args) => this.spotifyService.search(args.query, args.type, args.limit) }
    };
}
;
