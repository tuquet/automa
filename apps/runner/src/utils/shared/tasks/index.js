import { generalTasks } from './general.js';
import { browserTasks } from './browser.js';
import { interactionTasks } from './interaction.js';
import { conditionsTasks } from './conditions.js';
import { onlineServicesTasks } from './onlineServices.js';
import { dataTasks } from './data.js';
import { packageTasks } from './package.js';

export const tasks = {
  ...generalTasks,
  ...browserTasks,
  ...interactionTasks,
  ...conditionsTasks,
  ...onlineServicesTasks,
  ...dataTasks,
  ...packageTasks,
};

export {
  generalTasks,
  browserTasks,
  interactionTasks,
  conditionsTasks,
  onlineServicesTasks,
  dataTasks,
  packageTasks,
};

export default tasks;
