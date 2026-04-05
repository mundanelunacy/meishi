import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  GoogleCreateContactResponse,
  GoogleUpdatePhotoResponse,
  CreateContactPayload,
} from "../../shared/types/google";
import type { GoogleAuthState, VerifiedContact } from "../../shared/types/models";
import { base64FromDataUrl } from "../../shared/lib/utils";

interface GooglePeopleApiState {
  onboarding: {
    googleAuth: Pick<GoogleAuthState, "accessToken" | "mode">;
  };
}

function buildContactPayload(contact: VerifiedContact): CreateContactPayload {
  return {
    names: [
      {
        displayName: contact.fullName,
        givenName: contact.firstName,
        familyName: contact.lastName,
      },
    ],
    emailAddresses: contact.email ? [{ value: contact.email }] : undefined,
    phoneNumbers: contact.phone ? [{ value: contact.phone }] : undefined,
    organizations:
      contact.organization || contact.title
        ? [
            {
              name: contact.organization,
              title: contact.title,
            },
          ]
        : undefined,
    biographies: contact.notes ? [{ value: contact.notes }] : undefined,
    urls: contact.website ? [{ value: contact.website, type: "work" }] : undefined,
    addresses: contact.address ? [{ formattedValue: contact.address }] : undefined,
  };
}

export const googlePeopleApi = createApi({
  reducerPath: "googlePeopleApi",
  baseQuery: fakeBaseQuery(),
  endpoints: (builder) => ({
    createContact: builder.mutation<GoogleCreateContactResponse, VerifiedContact>({
      async queryFn(contact, api) {
        const state = api.getState() as GooglePeopleApiState;
        const { accessToken, mode } = state.onboarding.googleAuth;

        if (mode === "mock") {
          return {
            data: {
              resourceName: `people/mock-${contact.id}`,
              etag: "mock-etag",
            },
          };
        }

        if (!accessToken) {
          return {
            error: {
              status: 401,
              data: "Google authorization is required before syncing contacts.",
            },
          };
        }

        try {
          const response = await fetch(
            "https://people.googleapis.com/v1/people:createContact?personFields=names,emailAddresses,phoneNumbers,organizations,biographies,urls,addresses",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${accessToken}`,
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
      async queryFn(args, api) {
        const state = api.getState() as GooglePeopleApiState;
        const { accessToken, mode } = state.onboarding.googleAuth;

        if (mode === "mock") {
          return {
            data: {
              person: {
                resourceName: args.resourceName,
              },
            },
          };
        }

        if (!accessToken) {
          return {
            error: {
              status: 401,
              data: "Google authorization is required before uploading a contact photo.",
            },
          };
        }

        try {
          const response = await fetch(
            `https://people.googleapis.com/v1/${args.resourceName}:updateContactPhoto?personFields=photos`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${accessToken}`,
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
