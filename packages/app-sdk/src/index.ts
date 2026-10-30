export interface BizBoxContext {
  tenant: {
    id: string;
    name: string;
    businessType: string;
  };
  outlets: string[];
  grantedScopes: string[];
  settings: Record<string, any>;
}

export interface RegisterActionOptions {
  label: string;
  onClick: (payload?: any) => void;
}

export type EventHandler = (payload: any) => void;

export class BizBox {
  private static instance: BizBox | null = null;
  private token: string | null = null;
  private apiBaseUrl: string;
  private eventHandlers: Map<string, EventHandler[]> = new Map();

  private constructor() {
    this.apiBaseUrl = process.env.BIZBOX_API_URL || 'https://api.bizbox.in/v1';
  }

  /**
   * Initializes the BizBox App SDK by reading the installation token
   * injected into the app shell or environment.
   */
  public static async init(): Promise<BizBox> {
    if (!BizBox.instance) {
      BizBox.instance = new BizBox();
      
      // Read token from environment, window postMessage, or shell query param
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        BizBox.instance.token = urlParams.get('token') || (window as any).__BIZBOX_TOKEN__ || null;
      } else {
        BizBox.instance.token = process.env.BIZBOX_INSTALLATION_TOKEN || null;
      }
    }
    return BizBox.instance;
  }

  /**
   * Returns current tenant, outlets, granted scopes, and app configuration
   */
  public async context(): Promise<BizBoxContext> {
    return this.api.get<BizBoxContext>('/app/context');
  }

  /**
   * POS / Platform API client with pre-authenticated tenant scopes
   */
  public api = {
    get: async <T = any>(endpoint: string, params?: Record<string, string>): Promise<T> => {
      const url = new URL(`${this.apiBaseUrl}${endpoint}`);
      if (params) {
        Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
      }

      const res = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${this.token || ''}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        throw new Error(`BizBox API error [${res.status}]: ${await res.text()}`);
      }

      return res.json() as Promise<T>;
    },

    post: async <T = any>(endpoint: string, body?: any): Promise<T> => {
      const res = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body || {}),
      });

      if (!res.ok) {
        throw new Error(`BizBox API error [${res.status}]: ${await res.text()}`);
      }

      return res.json() as Promise<T>;
    },
  };

  /**
   * Platform event listeners (WebSocket or Webhooks)
   */
  public events = {
    on: (eventName: string, handler: EventHandler) => {
      const handlers = this.eventHandlers.get(eventName) || [];
      handlers.push(handler);
      this.eventHandlers.set(eventName, handlers);

      if (typeof window !== 'undefined') {
        window.addEventListener('message', (ev) => {
          if (ev.data && ev.data.type === 'BIZBOX_EVENT' && ev.data.event === eventName) {
            handler(ev.data.payload);
          }
        });
      }
    },
    emit: (eventName: string, payload: any) => {
      const handlers = this.eventHandlers.get(eventName) || [];
      handlers.forEach(h => h(payload));
    }
  };

  /**
   * App shell UI registration and notifications
   */
  public ui = {
    registerAction: (slot: string, options: RegisterActionOptions) => {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
          type: 'BIZBOX_REGISTER_ACTION',
          slot,
          label: options.label,
        }, '*');

        window.addEventListener('message', (e) => {
          if (e.data && e.data.type === 'BIZBOX_ACTION_CLICK' && e.data.slot === slot) {
            options.onClick(e.data.payload);
          }
        });
      }
    },

    toast: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
          type: 'BIZBOX_TOAST',
          message,
          toastType: type,
        }, '*');
      } else {
        console.log(`[BizBox Toast - ${type.toUpperCase()}]: ${message}`);
      }
    },
  };
}
