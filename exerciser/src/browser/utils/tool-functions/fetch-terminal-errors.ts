import { injectable, inject } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { TerminalService } from '@theia/terminal/lib/browser/base/terminal-service';

@injectable()
export class FetchTerminalErrors implements ToolProvider {
    
    static ID = 'FETCH_TERMINAL_ERRORS_FUNCTION_ID';

    private terminalErrors: Map<string, string[]> = new Map();

    @inject(TerminalService)
    protected terminalService: TerminalService;

    constructor() {
        this.setupTerminalListeners();
    }

    getTool(): ToolRequest {
        return {
            id: FetchTerminalErrors.ID,
            name: 'Fetch Terminal Errors',
            description: 'Fetch the latest errors from the terminal output.',
            parameters: {
                type: 'object',
                properties: {
                    terminalId: {
                        type: 'string',
                        description: 'The ID of the terminal to fetch errors from. If not provided, the last active terminal will be used.',
                    },
                }
            },
            handler: async (argString: string) => {
                try {
                    const { terminalId } = JSON.parse(argString) || {};
                    const activeTerminal = this.terminalService.currentTerminal;

                    const effectiveTerminalId = terminalId || activeTerminal?.id;

    
                    if (!effectiveTerminalId) {
                        return {
                            terminalId: null,
                            errors: [
                                {
                                    message: "No terminal ID provided, and no active terminal detected.",
                                },
                            ],
                        };
                    }
    
                    const errors = this.terminalErrors.get(effectiveTerminalId) || [];
    
                    return {
                        terminalId: effectiveTerminalId,
                        errors: errors.map((error) => ({
                            message: error,
                        })),
                    };
                } catch (error) {
                    return {
                        terminalId: null,
                        errors: [
                            {
                                message: `Error processing terminal errors: ${error.message}`,
                            },
                        ],
                    };
                }
            },
        };
    }
    

    private setupTerminalListeners(): void {
        this.terminalService.onDidCreateTerminal((terminal) => {
            terminal.onData((data: string) => this.handleTerminalData(data, terminal.id));
        });
    
        const currentTerminal = this.terminalService.currentTerminal;
        if (currentTerminal) {
            currentTerminal.onData((data: string) => this.handleTerminalData(data, currentTerminal.id));
        } else {
            console.warn('No active terminal found for listening.');
        }
    }
    
    private handleTerminalData(data: string, terminalId: string): void {
        console.log(`Terminal Output [${terminalId}]: ${data}`);
    
        const normalizedData = data.replace(/\r\n/g, '\n').trim();
    
        const errorPatterns = [
            /error/i,
            /exception/i,
            /not recognized as an internal or external command/i,
            /failed/i
        ];
    
        if (errorPatterns.some(pattern => pattern.test(normalizedData))) {
            console.error(`Detected Error [${terminalId}]: ${normalizedData}`);
            this.captureErrors(normalizedData, terminalId);
        }
    }
    
    private captureErrors(data: string, terminalId: string): void {
        const errors = this.terminalErrors.get(terminalId) || [];
        errors.push(data.trim());
        this.terminalErrors.set(terminalId, errors);
        console.log(`Captured Error [${terminalId}]: ${data.trim()}`);
    }
    
    public getErrorsForTerminal(terminalId: string): string[] {
        return this.terminalErrors.get(terminalId) || [];
    }
    

}
