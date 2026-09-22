import { toCamelCase } from '@/utils/helper';
import customHandlers from '@business/blocks/backgroundHandler';

const handlerModules = import.meta.glob('./blocksHandler/*.js', {
  eager: true,
});
const handlers = Object.entries(handlerModules).reduce(
  (acc, [path, module]) => {
    const name = path
      .split('/')
      .pop()
      .replace(/^handler|\.js$/g, '');
    acc[toCamelCase(name)] = module?.default ?? module;
    return acc;
  },
  {}
);

export default function () {
  return {
    ...handlers,
    ...customHandlers(),
  };
}
