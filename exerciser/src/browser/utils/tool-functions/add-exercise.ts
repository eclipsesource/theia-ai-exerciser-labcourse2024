import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';
import { ExerciseService , Exercise} from "../../exercise-service";

@injectable()
export class AddExercise implements ToolProvider {
    static ID = 'ADD_EXERCISE_ID';

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    getTool(): ToolRequest {
        return {
            id: AddExercise.ID,
            name: 'Add Exercise',
            description: 'Add a new exercise to the list.',
            parameters: {
                type: 'object',
                properties: {
                    exercise: {
                        type: 'object',
                        description: 'The exercise to be added.',
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
                                        filename: { type: 'string' },
                                        content: { type: 'string' },
                                    },
                                },
                            },
                            conductor_files: {
                                type: 'array',
                                items: {
                                    type: 'object',
                                    properties: {
                                        filename: { type: 'string' },
                                        content: { type: 'string' },
                                    },
                                },
                            },
                        },
                        
                    },
                },
            },
            handler: async (arg_string: string): Promise<string> => {
                const { exercise } = this.parseArgs(arg_string);
                return  this.exerciseService.addExercise(exercise)
                    ? `Exercise "${exercise.exercise_name}" added successfully.`
                    : `Failed to add exercise.`;
            },
        };
    }
     /**
     * Parse the argument string into a structured object.
     * @param arg_string - The argument string to parse.
     * @returns An object containing the exercise details.
     */
     private parseArgs(arg_string: string): { exercise: Exercise } {
        return JSON.parse(arg_string);
    }
}

