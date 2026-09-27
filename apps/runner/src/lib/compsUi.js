import VTooltip from '../directives/VTooltip';
import VAutofocus from '../directives/VAutofocus';
import VClosePopover from '../directives/VClosePopover';

const uiComponents = import.meta.glob('../components/ui/*.vue', {
  eager: true,
});
const transitionComponents = import.meta.glob(
  '../components/transitions/*.vue',
  {
    eager: true,
  }
);

function registerComponents(app, comps) {
  Object.entries(comps).forEach(([path, module]) => {
    const componentName = path
      .split('/')
      .pop()
      .replace(/\.vue$/, '');
    const component = module?.default ?? module ?? {};
    app.component(componentName, component);
  });
}

export default function (app) {
  app.directive('tooltip', VTooltip);
  app.directive('autofocus', VAutofocus);
  app.directive('close-popover', VClosePopover);

  registerComponents(app, uiComponents);
  registerComponents(app, transitionComponents);
}
