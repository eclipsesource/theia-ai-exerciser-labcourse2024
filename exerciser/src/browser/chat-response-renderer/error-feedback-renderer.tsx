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
import {ErrorFeedbackChatResponse} from "../exercise-conductor/types";
import {CodeWrapper} from "@theia/ai-chat-ui/lib/browser/chat-response-renderer";

export interface ErrorFeedbackChatResponseContent
    extends ChatResponseContent {
    kind: "error-feedback"
    content: ErrorFeedbackChatResponse;
}

export class ErrorFeedbackChatResponseContentImpl implements ErrorFeedbackChatResponseContent {
    readonly kind = 'error-feedback';
    protected _content: ErrorFeedbackChatResponse;

    constructor(content: ErrorFeedbackChatResponse) {
        this._content = content;
    }

    get content(): ErrorFeedbackChatResponse {
        return this._content;
    }

    asString(): string {
        return JSON.stringify(this._content);
    }

    merge(nextChatResponseContent: ErrorFeedbackChatResponseContent): boolean {
        this._content = {...this._content, ...nextChatResponseContent.content};
        return true;
    }
}

export namespace ErrorFeedbackChatResponseContent {
    export function is(obj: unknown): obj is ErrorFeedbackChatResponseContent {
        return (
            ChatResponseContent.is(obj) &&
            obj.kind === 'error-feedback' &&
            'content' in obj &&
            typeof (obj as { content: ErrorFeedbackChatResponse }).content === "object"
        );
    }
}

@injectable()
export class ErrorFeedbackRenderer implements ChatResponsePartRenderer<ErrorFeedbackChatResponseContent> {

    @inject(MonacoEditorProvider)
    protected readonly editorProvider: MonacoEditorProvider;
    @inject(UntitledResourceResolver)
    protected readonly untitledResourceResolver: UntitledResourceResolver;

    canHandle(response: ChatResponseContent): number {
        if (ErrorFeedbackChatResponseContent.is(response)) {
            return 10;
        }
        return -1;
    }

    render(response: ErrorFeedbackChatResponseContent): React.ReactNode {
        return (
            <div style={{display: "flex", flexDirection: "column", gap: 10, width:"100%" }}>
                {response.content.errors.map(item => {
                    return (
                        <div key={item.errorTitle}>
                            <div style={{
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "end",
                                alignItems: "center",
                                gap: 10
                            }}>
                                <p style={{flexGrow: 1}}>{item.errorTitle}</p>
                                <span
                                    className="codicon codicon-issues"
                                    title="show the problem in the editor"
                                    onClick={() => response.content.highlightLines(item.lines)}
                                />
                                
                            </div>
                            <div className="theia-CodePartRenderer-bottom">
                                <CodeWrapper
                                    content={item.description}
                                    untitledResourceResolver={this.untitledResourceResolver}
                                    editorProvider={this.editorProvider}
                                    contextMenuCallback={e => {}}
                                ></CodeWrapper>
                            </div>
                        </div>
                )
                })}
            </div>
        )
    }
}


/*

 */
