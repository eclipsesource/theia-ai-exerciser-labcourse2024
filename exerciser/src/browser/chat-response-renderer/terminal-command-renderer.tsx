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

import {inject, injectable} from "@theia/core/shared/inversify";
import {ChatResponsePartRenderer} from "@theia/ai-chat-ui/lib/browser/chat-response-part-renderer";
import {ChatResponseContent} from "@theia/ai-chat";
import * as React from '@theia/core/shared/react';
import { UntitledResourceResolver } from '@theia/core';
import { MonacoEditorProvider } from '@theia/monaco/lib/browser/monaco-editor-provider';
import {TerminalCommandChatResponse} from "../terminal-chat-agent/types";
import {CodeWrapper} from "@theia/ai-chat-ui/lib/browser/chat-response-renderer";

export interface TerminalCommandChatResponseContent
    extends ChatResponseContent {
    kind: "terminal-command"
    content: TerminalCommandChatResponse;
}

export class TerminalCommandChatResponseContentImpl implements TerminalCommandChatResponseContent {
    readonly kind = 'terminal-command';
    protected _content: TerminalCommandChatResponse;

    constructor(content: TerminalCommandChatResponse) {
        this._content = content;
    }

    get content(): TerminalCommandChatResponse {
        return this._content;
    }

    asString(): string {
        return JSON.stringify(this._content);
    }

    merge(nextChatResponseContent: TerminalCommandChatResponseContent): boolean {
        this._content = {...this._content, ...nextChatResponseContent.content};
        return true;
    }
}

export namespace TerminalCommandChatResponseContent {
    export function is(obj: unknown): obj is TerminalCommandChatResponseContent {
        return (
            ChatResponseContent.is(obj) &&
            obj.kind === 'terminal-command' &&
            'content' in obj &&
            typeof (obj as { content: TerminalCommandChatResponse }).content === "object"
        );
    }
}

@injectable()
export class TerminalCommandRenderer implements ChatResponsePartRenderer<TerminalCommandChatResponseContent> {

    @inject(MonacoEditorProvider)
    protected readonly editorProvider: MonacoEditorProvider;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;

    canHandle(response: ChatResponseContent): number {
        if (TerminalCommandChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: TerminalCommandChatResponseContent): React.ReactNode {
        return (
            <div style={{display: "flex", flexDirection: "column", gap: 10}}>
                {response.content.commands.map(item => {
                    return (
                        <div key={item.command}>
                            <div style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "end",
                                alignItems: "center",
                                gap: 10
                            }}>
                                <p style={{flexGrow: 1}}>{item.description}</p>
                                <span
                                    className="codicon codicon-insert option"
                                    title="Insert To Terminal"
                                    onClick={() => response.content.insertCallback(item.command)}
                                />
                                <span
                                    className="codicon codicon-run option"
                                    title="Insert To Terminal And Run"
                                    onClick={() => response.content.insertAndRunCallback(item.command)}
                                />
                            </div>
                            <CodeWrapper
                                content={item.command}
                                untitledResourceResolver={this.untitledResourceResolver}
                                editorProvider={this.editorProvider}
                                contextMenuCallback={e => {}}
                            />
                        </div>
                )
                })}
            </div>
        )
    }
}


/*

 */
