import { BaseAgent } from "./BaseAgent.js";
import { SpotifyService } from "../Services/SpotifyService.js";
import { media_tools } from "./toolDefinitions.js";
import { mediaPrompt } from "./prompts.js";

export class MediaAgent extends BaseAgent{
    protected model = 'gpt-4o';
    protected toolDefinitions = media_tools;
    protected systemPrompt = mediaPrompt;

    constructor(private spotifyService: SpotifyService){
        super();
    };

    protected tools = {
        'play': async (args: any) => this.spotifyService.play(args.query, args.type),
        'pause': async (args: any) => this.spotifyService.pause(),
        'skip': async (args: any) => this.spotifyService.skip(args.type),
        'addtoQueue': async (args: any) => this.spotifyService.addtoQueue(args.query),
        'toggleShuffle': async (args: any) => this.spotifyService.toggleShuffle(args.state),
        'search': async (args: any) => this.spotifyService.search(args.query, args.type, args.limit)
    };
};