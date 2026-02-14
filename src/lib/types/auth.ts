/**
 * Auth & Connection Type Definitions
 * [BYOD]
 */

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  created_at?: string;
  has_openai_key?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface WeaviateConnection {
  id: string;
  name: string;
  connection_type: 'self_hosted' | 'wcs_cloud';
  host: string;
  port: number;
  grpc_port: number;
  api_key: string | null;
  vectorizer_type: string;
  vectorizer_model: string;
  is_active: boolean;
  created_at: string | null;
  has_openai_key?: boolean;
}

export interface ConnectionCreateRequest {
  name?: string;
  connection_type: 'self_hosted' | 'wcs_cloud';
  host: string;
  port?: number;
  grpc_port?: number;
  api_key?: string | null;
  vectorizer_type?: string;
  vectorizer_model?: string;
}

export interface ConnectionTestRequest {
  connection_type: 'self_hosted' | 'wcs_cloud';
  host: string;
  port?: number;
  grpc_port?: number;
  api_key?: string | null;
}
