import {Exercise} from "../exercise-service/types";

export type ExerciseChatResponse = Omit<Exercise, "id"> & {renderSwitch: "exerciseFiles" | "conductorFiles"};
