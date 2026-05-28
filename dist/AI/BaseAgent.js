import { log, logError } from "../utilities.js";
import { openai } from "../app.js";
export var AgentCodes;
(function (AgentCodes) {
    AgentCodes[AgentCodes["SUCCESS"] = 0] = "SUCCESS";
    AgentCodes[AgentCodes["SUCCESS_FINAL"] = 1] = "SUCCESS_FINAL";
    AgentCodes[AgentCodes["ERROR"] = 2] = "ERROR";
})(AgentCodes || (AgentCodes = {}));
;
export var ToolResponseType;
(function (ToolResponseType) {
    ToolResponseType[ToolResponseType["CONTEXT"] = 0] = "CONTEXT";
    ToolResponseType[ToolResponseType["FINAL"] = 1] = "FINAL";
    ToolResponseType[ToolResponseType["AGENT"] = 2] = "AGENT"; // acts the same as FINAL but we only take the content of the last message from the output
})(ToolResponseType || (ToolResponseType = {}));
;
export class BaseAgent {
    async run(messages) {
        try {
            while (true) {
                const response = await openai.responses.create({
                    model: this.model,
                    instructions: this.systemPrompt,
                    input: messages,
                    tools: this.toolDefinitions
                });
                function isToolCall(item) {
                    return item.type === "function_call";
                }
                ;
                const function_calls = response.output.filter(isToolCall);
                if (function_calls.length === 0) {
                    messages.push({ role: 'assistant', content: response.output_text });
                    return { code: AgentCodes.SUCCESS, content: [...messages] };
                }
                ;
                messages.push(...response.output);
                const final_outputs = [];
                const tool_outputs = [];
                let context_tools_called = false;
                for (const function_call of function_calls) {
                    const toolHandler = this.tools[function_call.name];
                    if (!toolHandler) {
                        logError(new Error(`Unknown function called: ${function_call.name}`), "Unknown function called, check error_log.txt");
                        return { code: AgentCodes.ERROR, content: "there's been an error, check error_log.txt for details" };
                    }
                    ;
                    const responseType = toolHandler.type;
                    let args;
                    try {
                        args = JSON.parse(function_call.arguments ?? "{}");
                    }
                    catch (error) {
                        logError(error, `Error parsing arguments for function ${function_call.name}`);
                        return { code: AgentCodes.ERROR, content: "there's been an error, check error_log.txt for details" };
                    }
                    ;
                    const function_call_result = await toolHandler.handler(args);
                    log(`tool "${function_call.name}" called with arguments ${JSON.stringify(args)}`);
                    function pushToolOutput(call_id, content) {
                        tool_outputs.push({
                            type: 'function_call_output',
                            call_id: function_call.call_id,
                            output: content
                        });
                    }
                    ;
                    function pushFinalOutput(content) {
                        final_outputs.push({
                            role: 'assistant',
                            content: content
                        });
                    }
                    ;
                    if (responseType === ToolResponseType.CONTEXT) {
                        context_tools_called = true;
                        pushToolOutput(function_call.call_id, JSON.stringify(function_call_result));
                    }
                    else if (responseType === ToolResponseType.FINAL) {
                        pushToolOutput(function_call.call_id, 'called');
                        //print out the response
                        console.log(function_call_result);
                        //
                        pushFinalOutput(function_call_result);
                    }
                    else if (responseType === ToolResponseType.AGENT) {
                        pushToolOutput(function_call.call_id, 'called');
                        // print out the response
                        console.log(function_call_result?.content.at(-1)?.content);
                        //
                        pushFinalOutput(function_call_result?.content.at(-1)?.content);
                    }
                    ;
                    if (final_outputs.length > 0) {
                        messages.push(...final_outputs);
                    }
                    ;
                    if (tool_outputs.length > 0) {
                        messages.push(...tool_outputs);
                    }
                    ;
                    if (!context_tools_called) { // this is a state where all of the called tools where of type FINAL or AGENT, so there's no need to do another loop for LLM response
                        return { code: AgentCodes.SUCCESS_FINAL, content: [...messages] };
                    }
                    ;
                }
                ;
            }
            ;
        }
        catch (error) {
            logError(error, "Error in BaseAgent run method");
            return { code: AgentCodes.ERROR, content: "there's been an error, check error_log.txt for details" };
        }
        ;
    }
    ;
}
;
