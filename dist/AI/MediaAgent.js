import { BaseAgent } from "./BaseAgent.js";
import { media_tools } from "./toolDefinitions.js";
import { mediaPrompt } from "./prompts.js";
export class MediaAgent extends BaseAgent {
    constructor(spotifyService) {
        super();
        this.spotifyService = spotifyService;
        this.model = 'gpt-4o';
        this.toolDefinitions = media_tools;
        this.systemPrompt = mediaPrompt;
        this.tools = {
            'play': async (args) => this.spotifyService.play(args.query, args.type),
            'pause': async (args) => this.spotifyService.pause(),
            'skip': async (args) => this.spotifyService.skip(args.type),
            'addtoQueue': async (args) => this.spotifyService.addtoQueue(args.query),
            'toggleShuffle': async (args) => this.spotifyService.toggleShuffle(args.state),
            'search': async (args) => this.spotifyService.search(args.query, args.type, args.limit)
        };
    }
    ;
}
;
