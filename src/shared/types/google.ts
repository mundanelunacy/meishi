export interface CreateContactPayload {
  names?: Array<{ givenName?: string; familyName?: string; displayName?: string }>;
  emailAddresses?: Array<{ value: string; type?: string }>;
  phoneNumbers?: Array<{ value: string; type?: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  biographies?: Array<{ value: string }>;
  urls?: Array<{ value: string; type?: string }>;
  addresses?: Array<{ formattedValue: string; type?: string }>;
  relations?: Array<{ person: string; type?: string }>;
  events?: Array<{ date: { year: number; month: number; day: number }; type?: string }>;
  userDefined?: Array<{ key: string; value: string }>;
}

export interface GoogleCreateContactResponse {
  resourceName: string;
  etag?: string;
}

export interface GoogleUpdatePhotoResponse {
  person?: {
    resourceName: string;
  };
}
