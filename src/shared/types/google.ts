export interface CreateContactPayload {
  names?: Array<{ givenName?: string; familyName?: string; displayName?: string }>;
  emailAddresses?: Array<{ value: string }>;
  phoneNumbers?: Array<{ value: string }>;
  organizations?: Array<{ name?: string; title?: string }>;
  biographies?: Array<{ value: string }>;
  urls?: Array<{ value: string; type?: string }>;
  addresses?: Array<{ formattedValue: string }>;
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
