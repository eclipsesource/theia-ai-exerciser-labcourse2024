import { inject, injectable } from '@theia/core/shared/inversify';
import { ToolProvider, ToolRequest } from '@theia/ai-core';


export interface ExerciseFile{
    filename: string;
    content: string;
}


export  interface Exercise {
    exercise_id:string;
    exercise_name: string;
    exercise_summarization: string;
    file_list_summarization: string;
    exercise_files: ExerciseFile[];
    conductor_files: ExerciseFile[];
}
@injectable()
export class ExerciseService {
    private exercises: Exercise[] = [];

    

    /**
     * Add a new exercise to the list.
     * @param exercise - The exercise to be added.
     * @returns A boolean indicating success.
     */
    addExercise(exercise: Exercise): boolean {
        this.exercises.push(exercise);
        console.log(`Exercise added: ${exercise.exercise_name}`);
        return true;
    }

    /**
     * Retrieve an exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise.
     * @returns The exercise with the specified ID, or null if not found.
     */
    getExercise(exercise_id: string): Exercise | null {
        const exercise = this.exercises.find(ex => ex.exercise_id === exercise_id);
        if (!exercise) {
            console.error(`Exercise with ID ${exercise_id} not found.`);
            return null;
        }
        return exercise;
    }

    /**
     * Retrieve a list of all exercise names and summaries.
     * @returns A list of objects containing the name and summary of each exercise.
     */
    getExerciseList(): { exerciseName: string; exerciseSummary: string }[] {
        return this.exercises.map((exercise) => ({
            exerciseName: exercise.exercise_name,
            exerciseSummary: exercise.exercise_summarization,
        }));
    }

    /**
     * Update an existing exercise by its unique exercise_id.
     * @param exercise_id - The unique ID of the exercise to update.
     * @param updatedExercise - The new exercise data to replace the existing one.
     * @returns A boolean indicating success or failure.
     */
    updateExercise(exercise_id: string, updatedExercise: Exercise): boolean {
        const exercise = this.exercises.find(ex => ex.exercise_id === exercise_id);
        if (!exercise) {
            console.error(`Exercise with ID ${exercise_id} not found.`);
            return false;
        }

        // Update the entire exercise object
        Object.assign(exercise, updatedExercise);

        console.log(`Exercise updated: ${updatedExercise.exercise_name}`);
        return true;
    }
}


@injectable()
export class AddExercise implements ToolProvider {
    static ID = 'add-exercise';

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

@injectable()
export class GetExercise implements ToolProvider {
    static ID = 'get-exercise';

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
            handler: async (argString: string): Promise<string> => {
                const { exercise_id } = JSON.parse(argString);
                const exercise = this.exerciseService.getExercise(exercise_id);
                return exercise ? JSON.stringify(exercise, null, 2) : `Exercise with ID "${exercise_id}" not found.`;
            },
        };
    }

}

@injectable()
export class GetExerciseList implements ToolProvider {
    static ID = 'get-exercise-list';

    @inject(ExerciseService)
    protected readonly exerciseService: ExerciseService;

    getTool(): ToolRequest {
        return {
            id: GetExerciseList.ID,
            name: 'Get Exercise List',
            description: 'Retrieve a list of all exercise names and summarizations.',
            parameters: {
                type: 'object',
                properties: {},
            },
            handler: async (): Promise<string> => {
                const exercises = this.exerciseService.getExerciseList();
                return JSON.stringify(exercises, null, 2);
            },
        };
    }
}

@injectable()
export class UpdateExercise implements ToolProvider {
    static ID = 'update-exercise';

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





