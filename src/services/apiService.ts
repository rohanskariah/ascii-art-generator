export interface GenerateRequest {
  text: string;
  style: string;
  characterType: string;
  customPrompt?: string;
}

export interface GenerateResponse {
  ascii: string;
  success: boolean;
  error?: string;
}

export class ApiService {
  private baseUrl: string;

  constructor() {
    // Check if we're in development or production
    if (typeof window !== 'undefined') {
      // In browser environment, check for local development vs deployed
      const isLocalDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      if (isLocalDev) {
        // For local development, use the local server endpoint
        this.baseUrl = 'http://localhost:3000/api/ascii';
      } else {
        // For deployed environments, use relative path
        this.baseUrl = '/api/ascii';
      }
    } else {
      // In server environment, use the actual deployed URL or fallback
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '/api/ascii';
    }
  }

  async generateAscii(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json() as GenerateResponse;
    } catch (error) {
      console.error('API call failed:', error);
      // Provide a more helpful error message for local development
      if (typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        throw new Error(`Failed to connect to local server. Make sure the backend is running on http://localhost:3000. Error: ${(error as Error).message}`);
      }
      throw new Error(`Failed to generate ASCII art: ${(error as Error).message}`);
    }
  }
}

// Export a singleton instance
export const apiService = new ApiService();