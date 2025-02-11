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
import { AgentSpecificVariables, PromptTemplate, ToolInvocationRegistry,  } from '@theia/ai-core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { exerciseConductorTemplate } from "./template";
import { GET_EXERCISE_LIST_FUNCTION_ID, GET_EXERCISE_FUNCTION_ID, FETCH_TERMINAL_ERRORS_FUNCTION_ID } from '../utils/tool-functions/function-names';
import { ChatRequestModelImpl, ChatResponseContent, } from '@theia/ai-chat/lib/common';
import { LanguageModelResponse } from '@theia/ai-core';
import { ExerciseService } from '../exercise-service';
import { MarkdownChatResponseContentImpl,ToolCallChatResponseContentImpl } from "@theia/ai-chat";
import { Exercise, ExerciseOverview } from '../exercise-service/types';
import { ExerciseChatResponseContentImpl } from '../chat-response-renderer/exercise-renderer';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { URI } from '@theia/core/lib/common/uri';

import { ExerciseChatResponse } from "../exercise-creator/types";
import { EditorManager } from '@theia/editor/lib/browser/editor-manager';
import { EditorWidget, TextEditor } from '@theia/editor/lib/browser';
import { TerminalCommandChatResponseContentImpl } from "../chat-response-renderer/terminal-command-renderer";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { TerminalWidgetFactoryOptions } from "@theia/terminal/lib/browser/terminal-widget-impl"
import { MonacoEditor } from '@theia/monaco/lib/browser/monaco-editor';
import { DisposableCollection } from '@theia/core';
import { isLanguageModelStreamResponse, isLanguageModelTextResponse, isLanguageModelParsedResponse } from '@theia/ai-core';
import { ErrorFeedbackChatResponseContentImpl } from '../chat-response-renderer/error-feedback-renderer';
import * as monaco from '@theia/monaco-editor-core';

@injectable()
export class ExerciseConductorAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    protected activeEditorDisposables = new DisposableCollection();
    protected decorationCollection: monaco.editor.IEditorDecorationsCollection | null = null;
    protected activeEditor: EditorWidget | undefined;
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
            },  {
                name: 'currentFileWithNumberedLines',
                description: 'The content of the currently active file with line numbers.',
                usedInPrompt: true,
            }, {
                name: 'currentFileName',
                description: 'The name of the currently active file in the editor.',
                usedInPrompt: true,
            }
        ];

        // Register functions relevant for coding exercises, including file access and code execution
        this.functions = [GET_EXERCISE_LIST_FUNCTION_ID, GET_EXERCISE_FUNCTION_ID, FETCH_TERMINAL_ERRORS_FUNCTION_ID];
    }
    @postConstruct()
    init(): void {
        super.init();
        this.editorManager.onCurrentEditorChanged((editor) => {

            this.clearHighlights();

        });

    }
    /**
     * Parses the response text from the LLM to extract the command and parameters.

     */

    protected async parseTextResponse(response: LanguageModelResponse, request: ChatRequestModelImpl): Promise<string> {
        if (isLanguageModelTextResponse(response)) {
            return response.text;
        } else if (isLanguageModelStreamResponse(response)) {
            let result = '';
            for await (const chunk of response.stream) {
                const toolCalls = chunk.tool_calls;
                if (toolCalls !== undefined) {
                    const toolCallContents = toolCalls.map(toolCall =>
                        new ToolCallChatResponseContentImpl(toolCall.id, toolCall.function?.name, toolCall.function?.arguments, toolCall.finished, toolCall.result));
                    request.response.response.addContents(toolCallContents);
                }
                result += chunk.content ?? ''

            }
            return result;
        } else if (isLanguageModelParsedResponse(response)) {
            return response.content;
        }
        throw new Error(`Invalid response type ${response}`);
    }

    protected override async addContentsToResponse(response: LanguageModelResponse, request: ChatRequestModelImpl): Promise<void> {
        this.logger.info('Response as text:', response);

        const responseAsText = await this.parseTextResponse(response,request);
        this.logger.info('Response as text:', responseAsText);
        const jsonMatch = responseAsText.match(/(\{[\s\S]*\})/);
        this.logger.info('Response as text:', responseAsText);


        if (!jsonMatch) {
            this.logger.info('nothing');

            const contents = this.parseContents(responseAsText, request);
            request.response.response.addContents(contents);
        } else {
            const jsonString = jsonMatch[1];
            this.logger.info('JSON string:', jsonString);
            let jsonObj;
            try {
                jsonObj = JSON.parse(jsonString)
            } catch (error) {
                this.logger.error('Error parsing JSON:', error);
                const contents = this.parseContents(responseAsText, request);
                request.response.response.addContents(contents);
                return;
            }
            let beforeJsonContents: ChatResponseContent[] = [];
            let afterJsonContents: ChatResponseContent[] = [];
            if (jsonMatch && jsonMatch.index !== undefined) {
                beforeJsonContents = this.parseContents(responseAsText.slice(0, jsonMatch.index),request);
                console.log('beforeJsonContents', responseAsText.slice(0, jsonMatch.index), request);
                // afterJsonContents = this.parseContents(responseAsText.slice(jsonMatch.index + jsonString.length),request);
            }
            // const beforeJsonContents= this.parseContents(responseAsText.slice(0, jsonMatch.index));
            // const afterJsoncontents =this.parseContents(responseAsText.slice(jsonMatch.index + jsonString.length))
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
                case 'errorFeedbacks':
                    this.handleFeedbackErrorLines(request, jsonObj.errorFeedbacks, beforeJsonContents, afterJsonContents);
                    break;
                default:
                    const contents = this.parseContents(responseAsText, request);
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

                const exerciseContentChatResponse: ExerciseChatResponse = { ...exercise, renderSwitch: "conductorFiles" };
                request.response.response.addContent(new ExerciseChatResponseContentImpl(exerciseContentChatResponse));


            }
        } catch (error) {
            console.error('Error while fetching exercise details:', error);

        }
    }
    protected async handleTerminalCommand(request: ChatRequestModelImpl, parsedCommands: any[]): Promise<void> {
        try {


            if (parsedCommands.length > 0) {
                // Add terminal commands with interactive buttons
                request.response.response.addContent(
                    new TerminalCommandChatResponseContentImpl({
                        commands: parsedCommands,
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
    protected handleFeedbackErrorLines(request: ChatRequestModelImpl, errorFeedbacks: any[], beforeJsonContents: ChatResponseContent[], afterJsonContents: ChatResponseContent[]): void {
        try {
            // Highlight the error lines in the editor
            request.response.response.addContents(beforeJsonContents);

            request.response.response.addContent(new ErrorFeedbackChatResponseContentImpl({errors:errorFeedbacks,highlightLines:this.highlightLines.bind(this)}));
            // Add the feedback message to the chat response
            // request.response.response.addContent(new MarkdownChatResponseContentImpl('The following lines contain errors:'));
            // request.response.response.addContent(new MarkdownChatResponseContentImpl(`- ${feedbackErrorLines.join(', ')}`));
            request.response.response.addContents(afterJsonContents);
        } catch (error) {
            this.logger.error('Error handling feedback error lines:', error);
            request.response.response.addContent(new MarkdownChatResponseContentImpl('An error occurred while processing feedback error lines.'));

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

            const currentFileName = await this.getCurrentFileName();

            if (!currentFileName) {
                this.logger.warn('No active file found. Skipping currentFileName in the prompt.');
            }
            // const { fileText, linesWithNumbers, lineCount } = currentFileText || {
            const { linesWithNumbers} = currentFileText || {
                fileText: 'No active file content available.',
                linesWithNumbers: [],
                lineCount: 0,
            };

            const currentFileWithNumberedLines = linesWithNumbers
                .map(({ lineNumber, content }) => `Line ${lineNumber}: ${content}`)
                .join('\n');

            const exercises = JSON.stringify(this.exerciseService.allExercises)

            const resolvedPrompt = await this.promptService.getPrompt(exerciseConductorTemplate.id, {
                exercisesInService: exercises,
                // currentFileText: fileText,
                currentFileWithNumberedLines: currentFileWithNumberedLines || 'No active file content available.',
                // lineCount: lineCount,
                currentFileName: currentFileName || 'No active file found.',
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
        terminal.sendText(command + '\r\n');
    }

    async createTerminal() {
        const terminal = await this.terminalService.newTerminal(<TerminalWidgetFactoryOptions>{ created: new Date().toString() });
        await terminal.start();
        this.terminalService.open(terminal);

        await new Promise(resolve => setTimeout(resolve, 150));
        this.logger.info('Terminal created successfully.');
        return terminal;
    }
    protected highlightLines(lineNumbers: number[]): void {
        const editorWidget = this.editorManager.currentEditor;

        if (!editorWidget) {
            console.warn('No active editor found.');
            return;
        }

        const monacoEditor = editorWidget.editor as MonacoEditor;
        if (!monacoEditor) {
            console.warn('Monaco editor is not available for the active editor.');
            return;
        }

        const model = monacoEditor.getControl();
        if (!model) {
            console.warn('Monaco model is not available.');
            return;
        }

        // Clear previous highlights
        this.clearHighlights();

        // Create or update the decorations collection
        const decorations = lineNumbers.map(lineNumber => ({
            range: new monaco.Range(lineNumber, 1, lineNumber, 1),
            options: {
                isWholeLine: true,
                className: 'custom-line-highlight',
            }
        }));

        this.decorationCollection = model.createDecorationsCollection(decorations);

        // Dispose decorations when the active editor changes
        this.activeEditorDisposables.push({
            dispose: () => this.clearHighlights()
        });
    }

    protected clearHighlights(): void {
        if (this.decorationCollection) {
            this.decorationCollection.clear();
            this.decorationCollection = null;
        }
        this.activeEditorDisposables.dispose();
    }


}