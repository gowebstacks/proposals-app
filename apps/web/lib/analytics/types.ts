// Extend Window interface for analytics libraries
declare global {
  interface Window {
    analytics?: {
      page: {
        (properties?: Record<string, any>): void;
        (name: string, properties?: Record<string, any>): void;
      };
      track: (event: string, properties?: Record<string, any>) => void;
      identify: (userId: string, traits?: Record<string, any>) => void;
      group: (groupId: string, traits?: Record<string, any>) => void;
      ready: (callback: () => void) => void;
    };
    posthog?: any;
    dataLayer?: any[];
  }
}

export {};
