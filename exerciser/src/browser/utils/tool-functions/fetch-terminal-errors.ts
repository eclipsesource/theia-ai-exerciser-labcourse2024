import { injectable, inject } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { TerminalService} from '@theia/terminal/lib/browser/base/terminal-service';
import { FETCH_TERMINAL_ERRORS_FUNCTION_ID } from './function-names';

@injectable()
export class FetchTerminalErrors implements ToolProvider {
    
    static ID = FETCH_TERMINAL_ERRORS_FUNCTION_ID;

    @inject(TerminalService)
    protected terminalService: TerminalService;

    getTool(): ToolRequest {
        return {
            id: FetchTerminalErrors.ID,
            name: FetchTerminalErrors.ID,
            description: 'Fetch the latest content from the currently active terminal.',
            handler: async () => {
                try {
                    const activeTerminal = this.terminalService.currentTerminal;
                    if(activeTerminal) {
                        console.log(activeTerminal.terminalId)

                    }
                    if (!activeTerminal) {
                        throw new Error("No active terminal found.");
                    }

                    // Get terminal content from xterm.js buffer
                    const latestContent = await this.getActiveTerminalContent(activeTerminal);

                    return {
                        terminalId: activeTerminal.id,
                        content: latestContent || "No recent terminal output detected."
                    };
                } catch (error) {
                    return {
                        terminalId: null,
                        content: `Error fetching terminal content: ${error.message}`
                    };
                }
            },
        };
    }

    /**
     * Fetch terminal content from the active xterm.js instance.
     */
    private async getActiveTerminalContent(terminal: any ): Promise<string> {
        if (!terminal) {
            throw new Error("Terminal instance not found.");
        }

        // Try to access the xterm.js instance (depends on Theia API)
        const xtermInstance = terminal.term; // Theia's xterm.js terminal instance

        if (!xtermInstance) {
            throw new Error("Unable to access terminal content.");
        }

        // Get all the buffer lines from xterm.js
        const buffer = xtermInstance.buffer.active;
        let content = '';

        for (let i = 0; i < buffer.length; i++) {
            content += buffer.getLine(i)?.translateToString() + '\n';
        }

        return content.trim();
    }
}
