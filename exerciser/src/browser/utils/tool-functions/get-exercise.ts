import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { ExerciseService} from "../../exercise-service";
import {Exercise} from "../../exercise-service/types";


@injectable()
export class GetExercise implements ToolProvider {
    static ID = 'GET_EXERCISE_FUNCTIID';

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
                    exerciseId: {
                        type: 'string',
                        description: 'The unique ID of the exercise.',
                    },
                },

            },
            handler: async (arg_string: string): Promise<Exercise|null> => {
                const exerciseId = this.parseArgs(arg_string);

                const exercise = this.exerciseService.getExercise(exerciseId);
    
                return  exercise ;
            },
        };
    }
    private parseArgs(arg_string: string): string {
        const result = JSON.parse(arg_string);
        return result.exerciseId;
    }
}
