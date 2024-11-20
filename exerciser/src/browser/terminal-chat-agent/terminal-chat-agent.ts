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

import { inject, injectable } from '@theia/core/shared/inversify';
import { AbstractTextToModelParsingChatAgent, ChatAgent, SystemMessageDescription } from '@theia/ai-chat/lib/common';
import {
    PromptTemplate,
    AgentSpecificVariables
} from '@theia/ai-core';

import { terminalChatAgentTemplate } from "./template";

import {
    ChatRequestModelImpl,
    ChatResponseContent,
    CommandChatResponseContentImpl,
    CustomCallback,
    HorizontalLayoutChatResponseContentImpl,
    MarkdownChatResponseContentImpl,
} from '@theia/ai-chat';
import {
    CommandRegistry,
    MessageService,
    // generateUuid
} from '@theia/core';


interface ParsedCommand {
    type: 'terminal-command' | 'no-command'
    commandId: string;
    arguments?: string[];
    message?: string;
}

@injectable()
export class TerminalChatAgent extends AbstractTextToModelParsingChatAgent<ParsedCommand> implements ChatAgent {
    @inject(CommandRegistry)
    protected commandRegistry: CommandRegistry;
    @inject(MessageService)
    protected messageService: MessageService;
    readonly name: string;
    readonly description: string;
    readonly variables: string[];
    readonly promptTemplates: PromptTemplate[];
    readonly functions: string[];
    readonly agentSpecificVariables: AgentSpecificVariables[];

    constructor(
    ) {
        super('TerminalChatAgent', [{
            purpose: 'command',
            identifier: 'openai/gpt-4o',
        }], 'command');
        this.name = 'TerminalChatAgent';
        this.description = 'This agent is aware of all commands that the user can execute within the Theia IDE, the tool that the user is currently working with. \
        Based on the user request, it can find the right command and then let the user execute it.';
        this.variables = [];
        this.promptTemplates = [terminalChatAgentTemplate];
        this.functions = [];
        this.agentSpecificVariables = [{
            name: 'command-ids',
            description: 'The list of available commands in Theia.',
            usedInPrompt: true
        }];
    }

    protected async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {

        const systemPrompt = await this.promptService.getPrompt(terminalChatAgentTemplate.id);
        if (systemPrompt === undefined) {
            throw new Error('Couldn\'t get system prompt ');
        }
        return SystemMessageDescription.fromResolvedPromptTemplate(systemPrompt);
    }

    /**
     * @param text the text received from the language model
     * @returns the parsed command if the text contained a valid command.
     * If there was no json in the text, return a no-command response.
     */
    protected async parseTextResponse(text: string): Promise<any> {
        const jsonMatch = text.match(/(\{[\s\S]*\})/);
        const jsonString = jsonMatch ? jsonMatch[1] : `[]`;
        const parsedCommand = JSON.parse(jsonString);
        return parsedCommand;
    }


    protected createResponseContent(parsedCommand: any, request: ChatRequestModelImpl): ChatResponseContent {

        if (parsedCommand) {
            // const args = parsedCommand.arguments !== undefined &&
            //     parsedCommand.arguments.length > 0
            //     ? parsedCommand.arguments
            //     : undefined;
            // const id = `ai-command-${generateUuid()}`;
            //const commandArgs = Array.isArray(parsedCommand.arguments) ? parsedCommand.arguments : [];
            // const commandArgs = parsedCommand.arguments !== undefined && parsedCommand.arguments.length > 0 ? parsedCommand.arguments : [];
            //const args = [id, ...commandArgs];

            const customCallback: CustomCallback = {
                label: 'Copy the command to terminal', 
                callback: () => this.commandCallback(),
            };
            return new HorizontalLayoutChatResponseContentImpl([
                new MarkdownChatResponseContentImpl(
                    'I found this command that might help you: test terminal command'
                ),
                new CommandChatResponseContentImpl({id: 'custom-command'}, customCallback)
            ]);
        } else {
            return new MarkdownChatResponseContentImpl('Sorry, I can\'t find a suitable command for you');
        }
    }

    protected async commandCallback(): Promise<void> {
        console.log("***** test *****")
    }
}

