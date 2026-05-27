import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { logError } from "../utilities.js";

export class ElevenLabsService{
    private client: ElevenLabsClient;

    constructor(apiKey: string, private voiceID: string){
        this.client = new ElevenLabsClient({
            apiKey: apiKey
        });
    };

    async textToSpeech(text: string){
        try{
            const audioStream = await this.client.textToSpeech.convert(this.voiceID,{
                text: text,
                modelId: 'eleven_flash_v2',
                outputFormat: 'mp3_44100_128'
            });
            return audioStream
        }catch(error){
            logError(error, "Error in ElevenLabsService textToSpeech method");
            return "ERROR";
        };
    };

    async speechToText(source: Buffer){
        const response = await this.client.speechToText.convert({
            file: source,
            modelId: 'scribe_v2',
            languageCode: 'auto' 
        });

        return response.text;
    };
};