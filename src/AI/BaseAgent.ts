import { getEnvVar, log, logError } from "../utilities.js";
import { ResponseOutputItem } from "openai/resources/responses/responses.js";
import { openai } from "../app.js";


export enum AgentCodes{
    SUCCESS = 0, // some tool calls where of CONTEXT type, so we need to log the last response from the LLM
    SUCCESS_FINAL = 1, // all of the tool calls where FINAL or AGENT, so there's no need to log the last response from the LLM, as it's already done
    ERROR = 2
};

type Handler = (args: any) => Promise<any> | string;

export enum ToolResponseType{
    CONTEXT = 0, // the output of the tool will be added to the conversation, the response is decided by the LLM
    FINAL = 1, // the tool call and the output will not be appended to the conversation, instead the output will be injected as the response of the LLM
    AGENT = 2 // acts the same as FINAL but we only take the content of the last message from the output
};

export type ToolHandler = {
    type: ToolResponseType;
    handler: Handler;
};

type FinalResponse = {
    role: 'assistant',
    content: string
};

type ContextResponse = {
    type: 'function_call_output',
    call_id: string,
    output: string
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

                function isToolCall(item: ResponseOutputItem): item is Extract<ResponseOutputItem, {type: "function_call"}>{
                    return item.type === "function_call";
                };

                const function_calls= response.output.filter(isToolCall)

                if(function_calls.length === 0){
                    messages.push({role: 'assistant', content: response.output_text});
                    return {code: AgentCodes.SUCCESS, content: [...messages]};
                };

                messages.push(...response.output)

                const final_outputs: FinalResponse[] = [];
                const tool_outputs: ContextResponse[] = [];
                let context_tools_called = false;

                for(const function_call of function_calls){
                    const toolHandler = this.tools[function_call.name];

                    if(!toolHandler){
                        logError(new Error(`Unknown function called: ${function_call.name}`), "Unknown function called, check error_log.txt");
                        return {code: AgentCodes.ERROR , content:"there's been an error, check error_log.txt for details"};
                    };
                    
                    const responseType = toolHandler.type;
                    let args;

                    try{
                        args = JSON.parse(function_call.arguments ?? "{}");
                    }catch(error){
                        logError(error, `Error parsing arguments for function ${function_call.name}`);
                        return {code: AgentCodes.ERROR, content:"there's been an error, check error_log.txt for details"};
                    };

                    const function_call_result = await toolHandler.handler(args);
                    log(`tool "${function_call.name}" called with arguments ${JSON.stringify(args)}`);

                    function pushToolOutput(call_id: string, content: string){
                        tool_outputs.push({
                            type: 'function_call_output',
                            call_id: function_call.call_id,
                            output: content
                        });
                    };

                    function pushFinalOutput(content: string){
                        final_outputs.push({
                            role: 'assistant',
                            content: content
                        });
                    };

                    if(responseType === ToolResponseType.CONTEXT){
                        context_tools_called = true;
                        pushToolOutput(function_call.call_id, JSON.stringify(function_call_result));
                    }
                    else if(responseType === ToolResponseType.FINAL){
                        pushToolOutput(function_call.call_id, 'called');
                        //print out the response
                        console.log(function_call_result);
                        //
                        pushFinalOutput(function_call_result);
                    }
                    else if(responseType === ToolResponseType.AGENT){
                        pushToolOutput(function_call.call_id, 'called');
                        // print out the response
                        console.log(function_call_result?.content.at(-1)?.content)
                        //
                        pushFinalOutput(function_call_result?.content.at(-1)?.content);
                    };

                    if(final_outputs.length > 0){
                        messages.push(...final_outputs);
                    };
                    if(tool_outputs.length > 0){
                        messages.push(...tool_outputs);
                    };
                    
                    if(!context_tools_called){    // this is a state where all of the called tools where of type FINAL or AGENT, so there's no need to do another loop for LLM response
                        return {code: AgentCodes.SUCCESS_FINAL, content: [...messages]};
                    };
                };



                
            };
        }catch(error){
            logError(error, "Error in BaseAgent run method");
            return {code: AgentCodes.ERROR, content:"there's been an error, check error_log.txt for details"};
        };
    };
};