import customHandlers from '@business/blocks/contentHandler';
import { toCamelCase } from '@/utils/helper';

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
    ...(customHandlers() || {}),
    ...handlers,
  };
}
