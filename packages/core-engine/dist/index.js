// src/WorkflowEngine.ts
import cloneDeep2 from "lodash.clonedeep";
import { nanoid } from "nanoid";

// src/WorkflowWorker.ts
import cloneDeep from "lodash.clonedeep";

// src/BackwardCompatibilityFacade.ts
var BackwardCompatibilityFacade = class {
  constructor(worker) {
    this.worker = worker;
  }
  worker;
  /**
   * Binds the legacy block handler to a proxy context.
   */
  bind(blockHandler) {
    const context = this.createContext();
    return blockHandler.bind(context);
  }
  createContext() {
    const worker = this.worker;
    const engine = worker.engine;
    return {
      // Engine internal state
      engine: {
        isPopup: engine.isPopup
      },
      // Backward compatible properties
      get activeTab() {
        return worker.activeTab;
      },
      // Methods
      getBlockConnections: (blockId) => {
        return worker.getBlockConnections(blockId);
      },
      _sendMessageToTab: async (payload, options) => {
        return await worker._sendMessageToTab(payload, options);
      },
      getVariable: (key) => engine.referenceData.variables[key],
      setVariable: (key, value) => worker.setVariable(key, value)
      // Any other legacy context properties can be proxied here
    };
  }
};
export {
  BackwardCompatibilityFacade
};
