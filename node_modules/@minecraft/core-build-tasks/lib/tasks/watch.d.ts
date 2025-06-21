import { TaskFunction } from 'just-scripts';
/**
 * If command line parameter `option` is present, watch for changes in the specified files and run the specified task.
 * Otherwise, just run the task.
 * @param globs The file globs to watch.
 * @param taskFunction The task to run when changes are detected.
 */
export declare function watchTask(globs: string | string[], taskFunction: TaskFunction): TaskFunction;
