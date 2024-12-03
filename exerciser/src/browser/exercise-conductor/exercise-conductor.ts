// *****************************************************************************
// Copyright (C) 2024 EclipseSource GmbH.
//
// This program and the accompanying materials are made available under the
// terms of the Eclipse Public License v. 2.0 which is available at
// http://www.eclipse.org/legal/epl-2.0.
//
// This Source Code may also be made available under the following Secondary
// Licenses when the conditions for such availability set forth in the Eclipse
// Public License v. 2.0 are satisfied: GNU General Public License, version 2
// with the GNU Classpath Exception which is available at
// https://www.gnu.org/software/classpath/license.html.
//
// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0
// *****************************************************************************

import { AbstractStreamParsingChatAgent, ChatAgent, SystemMessageDescription } from '@theia/ai-chat/lib/common';
import { AgentSpecificVariables, PromptTemplate, ToolInvocationRegistry,  getTextOfResponse,} from '@theia/ai-core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { exerciseConductorTemplate } from "./template";
import { GET_EXERCISE_LIST_FUNCTION_ID, GET_EXERCISE_FUNCTION_ID } from './../utils/tool-functions/function-names';
import { ChatRequestModelImpl } from '@theia/ai-chat/lib/common';
import {
   
    LanguageModelResponse,
    
} from '@theia/ai-core';
import { ExerciseService } from '../exercise-service';



import {
    ChatResponseContent,
    HorizontalLayoutChatResponseContentImpl,
    MarkdownChatResponseContentImpl,
} from "@theia/ai-chat";

@injectable()
export class ExerciseConductorAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    @inject(ToolInvocationRegistry)
    protected toolInvocationRegistry: ToolInvocationRegistry;

    @inject(ExerciseService)
    protected exerciseService: ExerciseService;

    constructor() {
        super('ExerciseConductor', [{
            purpose: 'chat',
            identifier: 'openai/gpt-4o',
        }], 'chat');

        this.name = 'ExerciseConductor';
        this.description = 'This agent assists with coding exercises by providing code snippets, explanations, and guidance. \
    It can execute code snippets, evaluate results, and answer questions related to coding challenges.';

        // Define the prompt template and variables specific to coding exercises
        this.promptTemplates = [exerciseConductorTemplate];
        this.variables = [];
        this.agentSpecificVariables = [];

        // Register functions relevant for coding exercises, including file access and code execution
        this.functions = [ GET_EXERCISE_LIST_FUNCTION_ID,  GET_EXERCISE_FUNCTION_ID];
    }

    /**
     * Parses the response text from the LLM to extract the command and parameters.
     
     */
    protected async parseTextResponse(text: string): Promise<{ function: string; parameters?: any }> {
        try {
            const jsonMatch = text.match(/(\{[\s\S]*\})/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response text.');
            }

            return JSON.parse(jsonMatch[1]);
        } catch (error) {
            console.error('Error parsing LLM response:', error);
            return { function: 'unknown' };
        }
    }
    protected override async addContentsToResponse(response: LanguageModelResponse, request: ChatRequestModelImpl): Promise<void> {
        const responseAsText = await getTextOfResponse(response);
        const jsonRegex= /(\{[\s\S]*\})/;
        const jsonMatch = responseAsText.match(jsonRegex);    
        if (!jsonMatch) {
            request.response.response.addContent(new MarkdownChatResponseContentImpl(responseAsText));
        }else{
            const jsonString = jsonMatch[1];
            const jsonObj=JSON.parse(jsonString)
            const beforeJson = responseAsText.slice(0, jsonMatch.index!);
            const afterJson =responseAsText.slice(jsonMatch.index! + jsonString.length)
            const key=Object.keys(jsonObj)[0]
            switch (key){
                case 'getExerciseList':
                this.handleGetExerciseList(request,jsonObj);
                case 'getExercise':
                // this.handleGetExercise(parsedCommand.parameters);
                default:
                request.response.response.addContent( new MarkdownChatResponseContentImpl(`Unknown`))
            }
        }   
        
    }   

    /**
     * Handles the command parsed from the LLM response and calls the appropriate function.
    
     */
    // protected async handleFunctionCall(parsedCommand: { function: string; parameters?: any }): Promise<void> {
    //     switch (parsedCommand.function) {
    //         case 'getExerciseList':
    //          this.handleGetExerciseList();
    //         case 'getExercise':
    //             return this.handleGetExercise(parsedCommand.parameters);
    //         default:
    //             return new MarkdownChatResponseContentImpl(`Unknown function "${parsedCommand.function}" invoked.`);
    //     }
    // }
    
    /**
         * Handles the `getExerciseList` function.
         * @returns The chatbot response content with the exercise list.
         */
    protected handleGetExerciseList(request: ChatRequestModelImpl,exerciseList:{exerciseId:string, exerciseName:string,exerciseSummarization:string}[]): void {
        try {
           
    
            const exerciseMarkdown = exerciseList
                .map(exercise => `- **${exercise.exerciseName}**: ${exercise.exerciseSummarization}`)
                .join('\n');
            const responseMessage = `Here are the available exercises:\n\n${exerciseMarkdown}`;
            request.response.response.addContent( new MarkdownChatResponseContentImpl(responseMessage))
        } catch (error) {
            console.error('Error fetching exercises:', error);
            request.response.response.addContent( new MarkdownChatResponseContentImpl('Failed to retrieve exercises. Please try again.'))
        }
    }
    
    
    /**
     * Handles the `getExercise` function.
     * @param parameters - Parameters for the function, including the exercise ID.
     * @returns The chatbot response content with the exercise details.
     */
    protected handleGetExercise(parameters: { id: string }): ChatResponseContent {
        try {
            const exercise = this.exerciseService.getExercise(parameters.id);

            if (!exercise) {
                return new MarkdownChatResponseContentImpl(`Exercise with ID "${parameters.id}" not found.`);
            }
    
            // Format the conductor files as Markdown
            const filesMarkdown = exercise.conductorFiles
            .map((file, index) => 
                `   ${index + 1}. **Filename:** ${file.filename}\n      **Content:**\n\`\`\`\n${file.content}\n\`\`\``)
            .join('\n\n');
    
            // Create the response message
            const responseMessage = 
            `### 1. Exercise Name\n` +
            `   **${exercise.exerciseName}**\n\n` +
            `### 2. Conductor Files\n\n${filesMarkdown}`;
            
            return new MarkdownChatResponseContentImpl(responseMessage);
        } catch (error) {
            console.error('Error while fetching exercise details:', error);
            return new MarkdownChatResponseContentImpl('Failed to retrieve exercise details. Please try again.');
        }
    }

    /**
     * Creates a response content for the parsed command.
     * Dynamically routes to the appropriate function handler.
     * @param parsedCommand - The parsed command from the LLM response.
     * @returns The chatbot response content.
     */
    // protected async createResponseContent(parsedCommand: { function: string; parameters?: any }): Promise<ChatResponseContent> {
    //     return this.handleFunctionCall(parsedCommand);
    // }
    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        const resolvedPrompt = await this.promptService.getPrompt(exerciseConductorTemplate.id);
        return resolvedPrompt ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt) : undefined;
    }
}
