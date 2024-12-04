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
                    id: {
                        type: 'string',
                        description: 'The unique ID of the exercise.',
                    },
                },

            },
            handler: async (arg_string: string): Promise<{ exercise: Exercise }> => {
                const args = JSON.parse(arg_string) as { id: string };

                if (!args.id) {
                    throw new Error('The "id" parameter is required.');
                }

                const exercise = this.exerciseService.getExercise(args.id);
                if (!exercise) {
                    throw new Error(`Exercise with ID "${args.id}" not found.`);
                }

                return { exercise };
            },

        };
    }
    // private parseArgs(arg_string: string): string {
    //     const result = JSON.parse(arg_string);
    //     return result.exercise_id;
    // }
}
