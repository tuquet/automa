import { hideAll } from 'tippy.js';

export default {
  mounted(el) {
    el.addEventListener('click', () => {
      setTimeout(hideAll, 0);
    });
  },
  beforeUnmount(el) {
    el.removeEventListener('click', hideAll);
  },
};
