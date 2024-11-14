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
import { AgentSpecificVariables, PromptTemplate } from '@theia/ai-core';
import { AiTerminalAgent } from '@theia/ai-terminal/lib/browser/ai-terminal-agent'
import { inject, injectable } from '@theia/core/shared/inversify';
// import { exerciseCreatorTemplate } from "./template";
// import { CREATE_FILE_FUNCTION_ID, GET_FILE_CONTENT_FUNCTION_ID, GET_WORKSPACE_FILES_FUNCTION_ID } from '../utils/tool-functions/function-names';

@injectable()
export class TerminalChatAgent extends AbstractStreamParsingChatAgent implements ChatAgent {
    name: string;
    description: string;
    promptTemplates: PromptTemplate[];
    variables: never[];
    readonly agentSpecificVariables: AgentSpecificVariables[];
    readonly functions: string[];

    @inject(AiTerminalAgent)
    protected terminalAgent: AiTerminalAgent;

    constructor() {
        super('TerminalChatAgent', [{
            purpose: 'chat',
            identifier: 'openai/gpt-4o',
        }], 'chat');

        // Set the agent name and description for coding exercises
        this.name = 'TerminalChatAgent';
        // TODO
        this.description = 'Agent for assisting with terminal commands in a chat interface';

        // Define the prompt template and variables specific to coding exercises
        this.promptTemplates = [{id: 'terminal-chat-agent', template: 
`
# Instructions
Generate one or more command suggestions based on the user's request, considering the shell being used,
the current working directory, and the recent terminal contents. Provide the best suggestion first,
followed by other relevant suggestions if the user asks for further options. 

Parameters:
- user-request: The user's question or request.
- shell: The shell being used, e.g., /usr/bin/zsh.
- cwd: The current working directory.
- recent-terminal-contents: The last 0 to 50 recent lines visible in the terminal.

Return the result in the following JSON format:
{
  "commands": [
    "best_command_suggestion",
    "next_best_command_suggestion",
    "another_command_suggestion"
  ]
}

## Example
user-request: "How do I commit changes?"
shell: "/usr/bin/zsh"
cwd: "/home/user/project"
recent-terminal-contents:
git status
On branch main
Your branch is up to date with 'origin/main'.
nothing to commit, working tree clean

## Expected JSON output
\`\`\`json
\{
  "commands": [
    "git commit",
    "git commit --amend",
    "git commit -a"
  ]
}
\`\`\`
`        }];
        this.variables = [];
        this.agentSpecificVariables = [];
    }

    
    protected override async getSystemMessageDescription(): Promise<SystemMessageDescription | undefined> {
        /*
        const resolvedPrompt = await this.promptService.getPrompt(this.promptTemplates[0].id);

        console.log('*** RESOLVED PROMPT ***', resolvedPrompt?.text)

        if (resolvedPrompt?.text) {
            const command = await this.terminalAgent.getCommands(resolvedPrompt?.text, "", "", [])
            console.log('*** TERMINAL CHAT AGENT OUTPUT ***', command);
        }

        return resolvedPrompt ? SystemMessageDescription.fromResolvedPromptTemplate(resolvedPrompt) : undefined;
        */
        return undefined
    }
}
