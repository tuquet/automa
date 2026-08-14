import WorkflowEngine from "./WorkflowEngine.js";
import WorkflowWorker from "./WorkflowWorker.js";

export class BackwardCompatibilityFacade {
	constructor(private worker: WorkflowWorker) {}

	/**
	 * Binds the legacy block handler to a proxy context.
	 */
	public bind(blockHandler: Function) {
		const context = this.createContext();
		return blockHandler.bind(context);
	}

	private createContext() {
		const worker = this.worker;
		const engine = worker.engine;
		return {
			// Engine internal state
			engine: {
				isPopup: engine.isPopup,
			},
			
			// Backward compatible properties
			get activeTab() {
				return worker.activeTab;
			},

			// Methods
			getBlockConnections: (blockId: string) => {
				return worker.getBlockConnections(blockId);
			},
			
			_sendMessageToTab: async (payload: any, options?: any) => {
				return await worker._sendMessageToTab(payload, options);
			},

			getVariable: (key: string) => engine.referenceData.variables[key],
			setVariable: (key: string, value: any) => worker.setVariable(key, value),

			// Any other legacy context properties can be proxied here
		};
	}
}
