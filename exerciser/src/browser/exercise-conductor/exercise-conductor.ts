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
import { AgentSpecificVariables, PromptTemplate, ToolInvocationRegistry, getTextOfResponse, } from '@theia/ai-core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { exerciseConductorTemplate } from "./template";
import { GET_EXERCISE_LIST_FUNCTION_ID, GET_EXERCISE_FUNCTION_ID } from '../utils/tool-functions/function-names';
import { ChatRequestModelImpl } from '@theia/ai-chat/lib/common';
import { LanguageModelResponse } from '@theia/ai-core';
import { ExerciseService } from '../exercise-service';
import { ChatResponseContent, MarkdownChatResponseContentImpl } from "@theia/ai-chat";
import { Exercise, ExerciseOverview } from '../exercise-service/types';
import { ExerciseChatResponseContentImpl } from '../chat-response-renderer/exercise-renderer';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { CommandChatResponseContentImpl } from '@theia/ai-chat';
import { CustomCallback } from '@theia/ai-chat/lib/common';
import {ExerciseChatResponse} from "../exercise-creator/types";
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { TextEditor } from '@theia/editor/lib/browser';

@injectable()
export class ExerciseConductorAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    @inject(ExerciseService)
    readonly exerciseService: ExerciseService;
    @inject(ToolInvocationRegistry)
    protected toolInvocationRegistry: ToolInvocationRegistry;

    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    @inject(FileService)
    protected readonly fileService: FileService;

    @inject(EditorManager)
    protected readonly editorManager: EditorManager;

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
        this.agentSpecificVariables = [
            {
                name: 'exercisesInService',
                description: 'The list of exercises available for the user to choose from.',
                usedInPrompt: true,
            },
        ];

        // Register functions relevant for coding exercises, including file access and code execution
        this.functions = [GET_EXERCISE_LIST_FUNCTION_ID, GET_EXERCISE_FUNCTION_ID];
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
        this.logger.info('Response as text:', response);

        const responseAsText = await getTextOfResponse(response);
        this.logger.info('Response as text:', responseAsText);
        const jsonMatch = responseAsText.match(/(\{[\s\S]*\})/);
        this.logger.info('Response as text:', responseAsText);

        if (!jsonMatch) {
            this.logger.info('nothing');

            const contents = this.parseContents(responseAsText);
            request.response.response.addContents(contents);
        } else {
            const jsonString = jsonMatch[1];
            this.logger.info('JSON string:', jsonString);
            let jsonObj;
            try{
                jsonObj = JSON.parse(jsonString)
            }catch(error){
                this.logger.error('Error parsing JSON:', error);
                const contents = this.parseContents(responseAsText);
                request.response.response.addContents(contents);
                return;
            }
            
            this.logger.info('JSON object:', jsonObj);
            // const beforeJson = responseAsText.slice(0, jsonMatch.index!);
            // const afterJson =responseAsText.slice(jsonMatch.index! + jsonString.length)
            const key = Object.keys(jsonObj)[0]
            switch (key) {
                case 'exerciseList':
                    this.handleGetExerciseList(request, jsonObj.exerciseList);
                    break;
                case 'exerciseContent':
                    this.handleGetExercise(request, jsonObj.exerciseContent);
                    break;
                default:
                    const contents = this.parseContents(responseAsText);
                    request.response.response.addContents(contents);
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
    protected handleGetExerciseList(request: ChatRequestModelImpl, exerciseList: ExerciseOverview[]): void {
        try {
            const exerciseMarkdown = exerciseList
                .map(exercise => `- **${exercise.exerciseName}**: ${exercise.exerciseSummarization}'`)
                .join('\n');
            const responseMessage = `Here are the available exercises:\n\n${exerciseMarkdown}`;
            request.response.response.addContent(new MarkdownChatResponseContentImpl(responseMessage))
        } catch (error) {
            console.error('Error fetching exercises:', error);
            request.response.response.addContent(new MarkdownChatResponseContentImpl('Failed to retrieve exercises. Please try again.'))
        }
    }


    /**
     * Handles the `getExercise` function.
     * @param parameters - Parameters for the function, including the exercise ID.
     * @returns The chatbot response content with the exercise details.
     */
    protected handleGetExercise(request: ChatRequestModelImpl, exercise: Exercise): void {
        try {


            if (!exercise) {
                request.response.response.addContent(new MarkdownChatResponseContentImpl(`Exercise not found.`))
            } else {

                request.response.response.addContent(new MarkdownChatResponseContentImpl(`${exercise.exerciseSummarization}.`))
                request.response.response.addContent(new MarkdownChatResponseContentImpl(`${exercise.fileListSummarization}.`))

                const exerciseContentChatResponse : ExerciseChatResponse = {...exercise, renderSwitch: "conductorFiles"};
                // new ExerciseChatResponseContentImpl(exercise, renderSwitch:'conductorFiles');
                request.response.response.addContent(new ExerciseChatResponseContentImpl(exerciseContentChatResponse));
                request.response.response.addContent(this.fileGenerator(exercise));
                // Format the conductor files as Markdown
                request.response.response.addContent(new MarkdownChatResponseContentImpl(`Click the button to create the exercise in your workspace`))

            }
        } catch (error) {
            console.error('Error while fetching exercise details:', error);

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

    protected fileGenerator(exercise: Exercise): ChatResponseContent {
        const customCallback: CustomCallback = {
            label: 'Create Exercise',
            callback: async () => {
                const wsRoots = await this.workspaceService.roots;

                if (wsRoots.length === 0) {
                    console.error(`No workspace found to create files.`);
                }

                // Use the first workspace root as the base directory
                const rootUri = wsRoots[0].resource;

                // Create the exercise folder
                const exerciseFolderUri = rootUri.resolve(exercise.exerciseName);
                await this.fileService.createFolder(exerciseFolderUri);

                // Iterate over conductorFiles and create files in the exercise folder
                exercise.conductorFiles.forEach(async (conductorFile) => {
                    const fileUri = exerciseFolderUri.resolve(conductorFile.fileName);
                    await this.fileService.write(fileUri, conductorFile.content);
                });
            }

        };

        return new CommandChatResponseContentImpl({ id: 'custom-command' }, customCallback);
    }


     /**
     * Retrieves the text of the currently opened file in the editor.
     * @returns The text of the currently active file or `undefined` if no editor is active.
     */
    public async getCurrentFileText(): Promise<string | undefined> {
        const currentEditorWidget = this.editorManager.currentEditor;
        if (!currentEditorWidget) {
            console.error('No active editor found.');
            return undefined;
        }

        const editor: TextEditor = currentEditorWidget.editor;
        return editor.document.getText();
    }

    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        try {
            // Fetch the current file's text
            const currentFileText = await this.getCurrentFileText();
    
            if (!currentFileText) {
                this.logger.warn('No active file found. Skipping currentFileText in the prompt.');
            }
            const exercises = JSON.stringify(this.exerciseService.allExercises)

            const resolvedPrompt = await this.promptService.getPrompt(exerciseConductorTemplate.id, { 
                exercisesInService: exercises,
                currentFileText: currentFileText || 'No active file content available.',
            });

            return resolvedPrompt 
                ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt)
                : undefined;

       } catch (error) {
            this.logger.error('Error constructing system message description:', error);
            return undefined;
       }
    }

   

    
}



