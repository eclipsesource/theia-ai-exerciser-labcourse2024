import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { ExerciseService} from "../../exercise-service";

@injectable()
export class UpdateExercise implements ToolProvider {
    static ID = 'UPDATE_EXERCISE_FUNCTION_ID';

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    getTool(): ToolRequest {
        return {
            id: UpdateExercise.ID,
            name: 'Update Exercise',
            description: 'Update an existing exercise by its unique ID.',
            parameters: {
                type: 'object',
                properties: {
                    exercise_id: {
                        type: 'string',
                        description: 'The unique ID of the exercise to update.',
                    },
                    updatedExercise: {
                        type: 'object',
                        description: 'The updated exercise data.',
                        properties: {
                            exercise_id: { type: 'string' },
                            exercise_name: { type: 'string' },
                            exercise_summarization: { type: 'string' },
                            file_list_summarization: { type: 'string' },
                            exercise_files: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        fileName: { type: 'string' },
                                        content: { type: 'string' },
                                    },
                                },
                            },
                            conductor_files: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        fileName: { type: 'string' },
                                        content: { type: 'string' },
                                    },
                                },
                            },
                        },
                        required: ['exercise_name'],
                    },
                },

            },
            handler: async (argString: string): Promise<string> => {
                const { exercise_id, updatedExercise } = JSON.parse(argString);
                return  this.exerciseService.updateExercise(exercise_id, updatedExercise)
                ? `Exercise "${updatedExercise.exercise_name}" updated successfully.`
                : `Failed to update exercise with ID "${exercise_id}".`;
            },
        };
    }
}

