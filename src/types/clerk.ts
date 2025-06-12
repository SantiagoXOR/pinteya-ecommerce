// ===================================
// PINTEYA E-COMMERCE - TIPOS PARA CLERK
// ===================================

export interface ClerkUser {
  id: string;
  email_addresses: {
    email_address: string;
    id: string;
    verification: {
      status: string;
      strategy: string;
    };
  }[];
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

export interface WebhookEventData {
  data: ClerkUser;
  object: string;
  type: string;
}
