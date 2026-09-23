export type BrowserType = 'chromium';

export interface BrowserProfile {
  id: string;
  name: string;
  type?: BrowserType;
  path?: string;
  userDataDir?: string;
  isDefault?: boolean;
  args?: string[];
  headless?: boolean;
  proxy?: {
    server?: string;
    username?: string;
    password?: string;
  };
  headers?: Record<string, string>;
}

export interface BrowserStatus {
  id: string;
  isRunning: boolean;
  wsEndpoint?: string;
  port?: number;
  pid?: number;
}
