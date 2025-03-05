import { injectable ,inject ,postConstruct} from '@theia/core/shared/inversify';
import { Command, CommandContribution, CommandRegistry } from '@theia/core/lib/common';
import { ChatService,ChatAgentService,ChatAgent,ChatRequest } from '@theia/ai-chat/lib/common';
import { MessageService } from '@theia/core/lib/common';
@injectable()
export class ExerciseHintCommandContribution implements CommandContribution {

    @inject(MessageService)
    protected messageService: MessageService;
    @inject(ChatService)
    protected chatService: ChatService;
    protected chatSessionId: string ;
    protected  readonly chatAgentId: string ="ExerciseConductor";
    @inject(ChatAgentService)
    protected chatAgentService: ChatAgentService;
    protected agent:ChatAgent | undefined;
    @postConstruct()
    protected init(): void {
        this.chatService.onActiveSessionChanged(event => {
            if (event.sessionId) {
                this.chatSessionId = event.sessionId
            
            } else {
                this.chatSessionId=this.chatService.createSession().id

            }
            this.agent = this.chatAgentService.getAgent(this.chatAgentId);

        }) 
        
    }
    static readonly ExerciseHintCommand: Command = {
        id: 'exerciseHint.query',
        label: 'query for a hint for the exercise',
    };

    registerCommands(commands: CommandRegistry): void {
        commands.registerCommand(ExerciseHintCommandContribution.ExerciseHintCommand, {
            execute: (args: { lineNumber: number }) => {
                

                // Handle the command logic here
                if(!this.chatSessionId){
                    this.chatService.createSession()
                }
                const session = this.chatService.getSession(this.chatSessionId);
                if (session) {
                    session.pinnedAgent = this.agent;
                }
                const chatRequest: ChatRequest = {
                    text: `Hint for line ${args.lineNumber}`,
                }
                this.chatService.sendRequest(this.chatSessionId,chatRequest)
                
            }
        });
    }
}
