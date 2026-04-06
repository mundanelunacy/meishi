import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  GoogleCreateContactResponse,
  GoogleUpdatePhotoResponse,
} from "../../shared/types/google";
import type { VerifiedContact } from "../../shared/types/models";
import { base64FromDataUrl } from "../../shared/lib/utils";
import {
  getValidGoogleAccessToken,
  invalidateGoogleAccessTokenCache,
} from "../google-auth/googleIdentity";
import { buildContactPayload } from "./contactMapping";

async function fetchWithGoogleAccessToken(
  input: RequestInfo | URL,
  init: Omit<RequestInit, "headers"> & {
    headers?: Record<string, string>;
  }
) {
  let accessToken = await getValidGoogleAccessToken();
  let response = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status !== 401) {
    return response;
  }

  invalidateGoogleAccessTokenCache();
  accessToken = await getValidGoogleAccessToken();
  response = await fetch(input, {
    ...init,
    headers: {
      ...init.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response;
}

export const googlePeopleApi = createApi({
  reducerPath: "googlePeopleApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    createContact: builder.mutation<GoogleCreateContactResponse, VerifiedContact>({
      async queryFn(contact) {
        try {
          const response = await fetchWithGoogleAccessToken(
            "https://people.googleapis.com/v1/people:createContact?personFields=names,emailAddresses,phoneNumbers,organizations,nicknames,fileAses,biographies,urls,addresses,relations,events,userDefined",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(buildContactPayload(contact)),
            }
          );

          const payload = (await response.json()) as GoogleCreateContactResponse;
          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: payload,
              },
            };
          }

          return { data: payload };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: error instanceof Error ? error.message : "Unable to create Google contact.",
            },
          };
        }
      },
    }),
    updateContactPhoto: builder.mutation<
      GoogleUpdatePhotoResponse,
      { resourceName: string; dataUrl: string }
    >({
      async queryFn(args) {
        try {
          const response = await fetchWithGoogleAccessToken(
            `https://people.googleapis.com/v1/${args.resourceName}:updateContactPhoto?personFields=photos`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                photoBytes: base64FromDataUrl(args.dataUrl),
              }),
            }
          );

          const payload = (await response.json()) as GoogleUpdatePhotoResponse;
          if (!response.ok) {
            return {
              error: {
                status: response.status,
                data: payload,
              },
            };
          }

          return { data: payload };
        } catch (error) {
          return {
            error: {
              status: 500,
              data: error instanceof Error ? error.message : "Unable to upload the contact photo.",
            },
          };
        }
      },
    }),
  }),
});

export const { useCreateContactMutation, useUpdateContactPhotoMutation } = googlePeopleApi;
