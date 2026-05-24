import { getEnvVar, log, logError } from "../utilities.js";
import { ResponseOutputItem } from "openai/resources/responses/responses.js";
import { openai } from "../app.js";

type ToolHandler = (args: any) => Promise<any>;

export enum AgentCodes{
    SUCCESS = 0,
    ERROR = 1
};

export abstract class BaseAgent{
    protected abstract model: string;
    protected abstract tools: Record<string, ToolHandler>;
    protected abstract toolDefinitions: any[];
    protected abstract systemPrompt: string;

    async run(messages: any[]): Promise<{code: AgentCodes, content: any}>{
        try{
            while (true){
                const response = await openai.responses.create({
                    model: this.model,
                    instructions: this.systemPrompt,
                    input: messages,
                    tools: this.toolDefinitions
                });

                messages.push(...response.output);

                function isToolCall(item: ResponseOutputItem): item is Extract<ResponseOutputItem, {type: "function_call"}>{
                    return item.type === "function_call";
                };

                const function_calls= response.output.filter(isToolCall)

                if(function_calls.length === 0){
                    return {code: AgentCodes.SUCCESS, content: [...messages]};
                }

                for(const function_call of function_calls){
                    const handler = this.tools[function_call.name];

                    if(!handler){
                        logError(new Error(`Unknown function called: ${function_call.name}`), "Unknown function called, check error_log.txt");
                        return {code: AgentCodes.ERROR , content:"there's been an error, check error_log.txt for details"};
                    };
                    
                    let args;

                    try{
                        args = JSON.parse(function_call.arguments ?? "{}");
                    }catch(error){
                        logError(error, `Error parsing arguments for function ${function_call.name}`);
                        return {code: AgentCodes.ERROR, content:"there's been an error, check error_log.txt for details"};
                    };

                    const function_call_result = await handler(args);
                    log(`Function ${function_call.name} called with arguments ${JSON.stringify(args)}`);

                    messages.push(
                        {
                            type: 'function_call_output',
                            call_id: function_call.call_id,
                            output: JSON.stringify(function_call_result)
                        }
                    );
                };
            };
        }catch(error){
            logError(error, "Error in BaseAgent run method");
            return {code: AgentCodes.ERROR, content:"there's been an error, check error_log.txt for details"};
        };
    };
};