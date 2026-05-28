import { BaseAgent, ToolResponseType } from "./BaseAgent.js";
import { SpotifyService } from "../Services/SpotifyService.js";
import { media_tools } from "./toolDefinitions.js";
import { mediaPrompt } from "./prompts.js";

export class MediaAgent extends BaseAgent{
    protected model = 'gpt-5-nano';
    protected toolDefinitions = media_tools;
    protected systemPrompt = mediaPrompt;

    constructor(private spotifyService: SpotifyService){
        super();
    };

    protected tools = {
        'play': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.play(args.query, args.type)},
        'pause': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.pause()},
        'skip': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.skip(args.type)},
        'addtoQueue': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.addtoQueue(args.query)},
        'toggleShuffle': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.toggleShuffle(args.state)},
        'search': {type: ToolResponseType.CONTEXT, handler: async (args: any) => this.spotifyService.search(args.query, args.type, args.limit)}
    };
};