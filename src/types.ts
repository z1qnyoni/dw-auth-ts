export interface OAuthTokenResponse {
    access_token: string;
    token_type: "Bearer" | string;
    expires_in: number; // seconds, ~3600
    refresh_token?: string;
    scope?: string;
  }
  
  export interface DocuWareFileCabinetList {
    FileCabinet?: Array<{
      Id: string;
      Name: string;
      // add fields as needed
    }>;
  }
  