"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  BackwardCompatibilityFacade: () => BackwardCompatibilityFacade
});
module.exports = __toCommonJS(index_exports);

// src/WorkflowEngine.ts
var import_lodash2 = __toESM(require("lodash.clonedeep"), 1);
var import_nanoid = require("nanoid");

// src/WorkflowWorker.ts
var import_lodash = __toESM(require("lodash.clonedeep"), 1);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BackwardCompatibilityFacade
});
