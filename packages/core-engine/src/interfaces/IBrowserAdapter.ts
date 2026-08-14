export interface IBrowserAdapter {
	/**
	 * Send a message to the specified tab.
	 */
	sendMessageToTab(tabId: number, message: any): Promise<any>;

	/**
	 * Represents the current active tab context (id, url, etc.).
	 */
	activeTab: any;

	/**
	 * Execute a script inside the tab.
	 */
	executeScript(tabId: number, script: string, args?: any[]): Promise<any>;

	/**
	 * Any other browser-specific API methods used by legacy blocks.
	 */
	[key: string]: any;
}
