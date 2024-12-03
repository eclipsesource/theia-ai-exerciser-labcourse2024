import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { ExerciseService , Exercise} from "../../exercise-service";


@injectable()
export class GetExercise implements ToolProvider {
    static ID = 'GET_EXERCISE_ID';

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    getTool(): ToolRequest {
        return {
            id: GetExercise.ID,
            name: 'Get Exercise',
            description: 'Retrieve an exercise by its unique ID.',
            parameters: {
                type: 'object',
                properties: {
                    exercise_id: {
                        type: 'string',
                        description: 'The unique ID of the exercise.',
                    },
                },
               
            },
            handler: async (arg_string: string): Promise<Exercise|string> => {
                const exercise_id  = this.parseArgs(arg_string);
                const exercise = this.exerciseService.getExercise(exercise_id);
                return exercise ? exercise : `Exercise with ID "${exercise_id}" not found.`;
            },
            
        };
    }
    private parseArgs(arg_string: string): string {
        const result = JSON.parse(arg_string);
        return result.exercise_id;
    }
}