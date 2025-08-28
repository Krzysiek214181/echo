import OpenAI from "openai";
import { ChatCompletionMessageParam, ChatCompletionMessageToolCall, ChatCompletionTool } from "openai/resources/index";

import { log, logError } from "./app";
import { conversationPrompt, roomPrompt } from "./prompts";

export class OpenAIService{
    private openai: OpenAI

    constructor(){
        this.openai = new OpenAI();
    };

    //tools for converstation model to use
    private conversationTools: ChatCompletionTool[] = [
        {
            type: 'function',
            function: {
                name: 'resetConversation',
                description: 'clears the current conversation'
            }
        }
    ];

    //respose shema for conversation model
    private conversationResponseSchema = {
        name: "conversationResponse",
        schema: {
            type: "object",
            properties: {
                _thinking: {type: "string", description: "input your thoughts here if you need to think deeply"},
                result: {type: "string", description: "what you want the user to see"},
                _roomTasks: {type: "string", description: "list tasks qualified as room tasks"}
            },
            required: ["_thinking", "result", "_roomTasks"],
            additionalProperties: false
        }
    };
    
    //main conversation model
    async *streamConversation(messages: ChatCompletionMessageParam[], userMessage?: string): any{
        try{
            //#region if messages are empty, initialize with prompt, if userMessage, push into messages
            if(messages.length == 0){
                messages.push({
                    role: "system",
                    content: conversationPrompt
                });
            };
            if(userMessage){
                messages.push({
                    role: "user",
                    content: userMessage
                });
            };
            //#endregion

            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: messages, 
                stream: true,
                tools: this.conversationTools,
                tool_choice: 'auto',
                response_format: {
                    type: "json_schema",
                    json_schema: this.conversationResponseSchema
                }
            });

            let toolCallsList = []
            
            for await(const part of response){
                const chunk = part.choices[0].delta;
                if(chunk.tool_calls) toolCallsList.push(chunk.tool_calls);
                if(chunk.content) yield chunk.content;
            };

            //tool calls handling
            if(toolCallsList.length !== 0){
                const toolCallsObject = this.toolCallListToObject(toolCallsList);
                messages.push({
                    role: 'assistant',
                    tool_calls: toolCallsObject as ChatCompletionMessageToolCall[]
                });
                await Promise.all(toolCallsObject.map(async (tool_call)=>{
                    const id = tool_call.id;
                    const functionName = tool_call.function.name;
                    const args = JSON.parse(tool_call.function.arguments)

                    switch(functionName){
                        case("resetConversation"): 
                            messages = [];
                            break;
                        default:
                            messages.push({
                                role: 'tool',
                                tool_call_id: id,
                                content: `tool not found`
                            });
                    };
                }));

                const response =  await this.streamConversation(messages);
                for await (const part of response){
                    yield part;
                };
            };

        }catch(error){
            logError(error, "error while generating conversation model response, check error_log.txt");
        };
    };

    private toolCallListToObject(toolCallsList: any){
        interface ToolCall {
            id: string;
            function: {
                arguments: string;
                name: string;
            }
            type: string;
        }
    
        let tool_calls: ToolCall[] = [];
        for(const chunk of toolCallsList){
            const part = chunk[0];
            //create a blank for the functino to fill out
            while (tool_calls.length <= part["index"]) {
                tool_calls.push({
                    id: "",
                    function: {
                        name: "",
                        arguments: ""
                    },
                    type: ""
                });
            };
    
            //set params if existing in response
            if (part.id){
                tool_calls[part.index]["id"] = part.id;
            };
            if(part.type){
                tool_calls[part.index]["type"] = part.type;
            };
            if(part.function.name){
                tool_calls[part.index]["function"]["name"] = part.function.name;
            };
            //append arguments
            tool_calls[part.index]["function"]["arguments"] += part.function.arguments;
        };
    
        return tool_calls;
    };
};
