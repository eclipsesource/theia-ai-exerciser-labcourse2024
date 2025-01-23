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
import {  MarkdownChatResponseContentImpl} from "@theia/ai-chat";
import { Exercise, ExerciseOverview } from '../exercise-service/types';
import { ExerciseChatResponseContentImpl } from '../chat-response-renderer/exercise-renderer';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { URI } from '@theia/core/lib/common/uri';

import {ExerciseChatResponse} from "../exercise-creator/types";
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { TextEditor } from '@theia/editor/lib/browser';
import {TerminalCommandChatResponseContentImpl} from "../chat-response-renderer/terminal-command-renderer";
import {TerminalService} from "@theia/terminal/lib/browser/base/terminal-service";
import {TerminalWidgetFactoryOptions} from "@theia/terminal/lib/browser/terminal-widget-impl"


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

    @inject(TerminalService)
        protected terminalService: TerminalService;

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
            }, {
                name: 'command-ids',
                description: 'The list of available commands in Theia.',
                usedInPrompt: true
            }
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

        
    protected async parseTextResponseCommand(text: string): Promise<any> {
        const jsonMatch = text.match(/{(?:[^{}]|{[^{}]*})*}/g) || [];
        const parsedCommand: any[] = [];
        jsonMatch.forEach(match => {
            parsedCommand.push(JSON.parse(match));
        })
        return parsedCommand;
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
            const key = Object.keys(jsonObj)[0]
            switch (key) {
                case 'exerciseList':
                    this.handleGetExerciseList(request, jsonObj.exerciseList);
                    break;
                case 'exerciseContent':
                    this.handleGetExercise(request, jsonObj.exerciseContent);
                    break;
                case 'terminalCommands':
                    this.handleTerminalCommand(request, jsonObj.terminalCommands);
                    break;
                default:
                    const contents = this.parseContents(responseAsText);
                    request.response.response.addContents(contents);
            }
        }
    }

    
    


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
                request.response.response.addContent(new ExerciseChatResponseContentImpl(exerciseContentChatResponse));


            }
        } catch (error) {
            console.error('Error while fetching exercise details:', error);

        }
    }
    protected async handleTerminalCommand(request: ChatRequestModelImpl, parsedCommands: string): Promise<void> {
        try {
            // Validate and parse commands asynchronously
            const validCommands = await this.parseTextResponseCommand(parsedCommands);
    
            if (validCommands.length > 0) {
                // Add terminal commands with interactive buttons
                request.response.response.addContent(
                    new TerminalCommandChatResponseContentImpl({
                        commands: validCommands, 
                        insertCallback: this.insertCommand.bind(this),
                        insertAndRunCallback: this.insertAndRunCommand.bind(this),
                    })
                );
            } else {
                // No valid commands found
                request.response.response.addContent(
                    new MarkdownChatResponseContentImpl('No valid terminal commands were found. Please check the response.')
                );
            }
        } catch (error) {
            this.logger.error('Error handling terminal commands:', error);
            request.response.response.addContent(
                new MarkdownChatResponseContentImpl('An error occurred while processing terminal commands.')
            );
        }
    }
    
    
    /**
     * Parses and validates an array of commands.
     * @param parsedCommands - The array of commands to validate.
     * @returns A list of valid commands.
     */
    protected parseCommands(parsedCommands: any[]): { command: string; description: string }[] {
        if (!Array.isArray(parsedCommands)) {
            this.logger.warn('Expected an array of commands but received:', parsedCommands);
            return [];
        }
    
        return parsedCommands
            .map((cmd) => {
                if (cmd.command && cmd.description) {
                    return {
                        command: cmd.command,
                        description: cmd.description,
                    };
                } else {
                    this.logger.warn('Invalid command structure:', cmd);
                    return null;
                }
            })
            .filter((cmd): cmd is { command: string; description: string } => cmd !== null); // Remove null values
    }
    


     /**
     * Retrieves the text of the currently opened file in the editor.
     * @returns The text of the currently active file or `undefined` if no editor is active.
     */
     public async getCurrentFileText(): Promise<{ fileText: string, linesWithNumbers: { lineNumber: number; content: string }[], lineCount: number } | undefined> {
        const currentEditorWidget = this.editorManager.currentEditor;
        if (!currentEditorWidget) {
            console.error('No active editor found.');
            return undefined;
        }

        const editor: TextEditor = currentEditorWidget.editor;
        const fileText = editor.document.getText();

        const lines = fileText.split(/\r?\n/);
        const linesWithNumbers = lines.map((content, index) => ({
        lineNumber: index + 1,
        content,
     }));

     return {
        fileText,
        linesWithNumbers,
        lineCount: lines.length,
      };
    }

    public async getCurrentFileName(): Promise<string | undefined> {
        const currentEditorWidget = this.editorManager.currentEditor;
        if (currentEditorWidget) {
            const uri = new URI(currentEditorWidget.editor.document.uri);
            return uri.path.base; 
        }
        return undefined; 
    }

    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        try {
            // Fetch the current file's text
            const currentFileText = await this.getCurrentFileText();

            if (!currentFileText) {
                this.logger.warn('No active file found. Skipping currentFileText in the prompt.');
            }

            const { fileText, linesWithNumbers, lineCount } = currentFileText || {
                fileText: 'No active file content available.',
                linesWithNumbers: [],
                lineCount: 0,
            };
    
            const numberedLines = linesWithNumbers
                .map(({ lineNumber, content }) => `Line ${lineNumber}: ${content}`)
                .join('\n');
    
            const exercises = JSON.stringify(this.exerciseService.allExercises)

            const resolvedPrompt = await this.promptService.getPrompt(exerciseConductorTemplate.id, {
                exercisesInService: exercises,
                currentFileText: fileText,
                numberedLines: numberedLines || 'No active file content available.',
                lineCount: lineCount,
            });

            return resolvedPrompt
                ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt)
                : undefined;

       } catch (error) {
            this.logger.error('Error constructing system message description:', error);
            return undefined;
       }
    }

    /**
         * @param text the text received from the language model
         * @returns the parsed command if the text contained a valid command.
         * If there was no json in the text, return a no-command response.
         */

    
    
        // protected createResponseContent(parsedCommand: any, request: ChatRequestModelImpl): ChatResponseContent {
        //     if (parsedCommand) {
        //         return new TerminalCommandChatResponseContentImpl({
        //             commands: parsedCommand,
        //             insertCallback: this.insertCommand.bind(this),
        //             insertAndRunCallback: this.insertAndRunCommand.bind(this)
        //         });
        //     } else {
        //         return new MarkdownChatResponseContentImpl('Sorry, I can\'t find a suitable command for you');
        //     }
        // }
    
        protected async insertCommand(command: string): Promise<void> {
            try {
                let terminal = this.terminalService.currentTerminal;
        
                if (!terminal) {
                    terminal = await this.createTerminal();
                } else {
                    await this.terminalService.open(terminal);
                }
        
                await new Promise(resolve => setTimeout(resolve, 150));
        
                terminal.sendText(command);
                this.logger.info(`Inserted command: ${command}`);
            } catch (error) {
                this.logger.error('Error inserting command:', error);
            }
        }
        
    
        protected async insertAndRunCommand(command: string): Promise<void> {
            let terminal = this.terminalService.currentTerminal;
            if (!terminal) {
                terminal = await this.createTerminal();
            }
            terminal.sendText(command + '\n');
        }
    
        async createTerminal() {
            const terminal = await this.terminalService.newTerminal(<TerminalWidgetFactoryOptions>{ created: new Date().toString() });
            await terminal.start();
            this.terminalService.open(terminal);

            await new Promise(resolve => setTimeout(resolve, 150));
            this.logger.info('Terminal created successfully.');
            return terminal;
        }
}