import { TaskFunction } from 'just-scripts';
export type UpdateWorldParameters = {
    /**
     * The path to the world backup directory.
     */
    backupPath: string;
    /**
     * The path to the development world directory.
     */
    devWorldPath: string;
};
/**
 * A just task which updates the world in the game from the development path. Original world is backed up.
 */
export declare function updateWorldTask(params: UpdateWorldParameters): TaskFunction;
