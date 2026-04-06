import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VerifiedContact } from "../../shared/types/models";
import { googlePeopleApi } from "./googlePeopleApi";

const getValidGoogleAccessTokenMock = vi.fn();
const invalidateGoogleAccessTokenCacheMock = vi.fn();

vi.mock("../google-auth/googleIdentity", () => ({
  getValidGoogleAccessToken: (...args: unknown[]) => getValidGoogleAccessTokenMock(...args),
  invalidateGoogleAccessTokenCache: (...args: unknown[]) =>
    invalidateGoogleAccessTokenCacheMock(...args),
}));

const contact: VerifiedContact = {
  id: "draft-1",
  sourceImageIds: ["img-1"],
  fullName: "Ada Lovelace",
  namePrefix: "",
  firstName: "Ada",
  phoneticFirstName: "",
  phoneticMiddleName: "",
  phoneticLastName: "",
  lastName: "Lovelace",
  nickname: "",
  fileAs: "Lovelace, Ada",
  organization: "Analytical Engines",
  department: "",
  title: "Founder",
  email: "ada@example.com",
  phone: "",
  website: "",
  notes: "",
  address: "",
  emails: [{ value: "ada@example.com", type: "WORK", label: "" }],
  phones: [],
  websites: [],
  addresses: [],
  relatedPeople: [],
  significantDates: [],
  customFields: [],
  confidenceNotes: [],
  extractionSnapshot: null,
  createdAt: "2026-04-05T00:00:00.000Z",
  updatedAt: "2026-04-05T00:00:00.000Z",
  verifiedAt: "2026-04-06T00:00:00.000Z",
};

function createStore() {
  return configureStore({
    reducer: {
      [googlePeopleApi.reducerPath]: googlePeopleApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(googlePeopleApi.middleware),
  });
}

describe("googlePeopleApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests a Google access token lazily before creating a contact", async () => {
    getValidGoogleAccessTokenMock.mockResolvedValue("google-token-1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ resourceName: "people/123" }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );

    const store = createStore();
    const result = await store.dispatch(googlePeopleApi.endpoints.createContact.initiate(contact)).unwrap();

    expect(result).toEqual({ resourceName: "people/123" });
    expect(getValidGoogleAccessTokenMock).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("people:createContact"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer google-token-1",
        }),
      })
    );
  });

  it("invalidates the token cache and retries once after a 401 response", async () => {
    getValidGoogleAccessTokenMock
      .mockResolvedValueOnce("expired-token")
      .mockResolvedValueOnce("fresh-token");
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ error: { message: "Expired token" } }), {
            status: 401,
            headers: {
              "Content-Type": "application/json",
            },
          })
        )
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ resourceName: "people/456" }), {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          })
        )
    );

    const store = createStore();
    const result = await store.dispatch(googlePeopleApi.endpoints.createContact.initiate(contact)).unwrap();

    expect(result).toEqual({ resourceName: "people/456" });
    expect(getValidGoogleAccessTokenMock).toHaveBeenCalledTimes(2);
    expect(invalidateGoogleAccessTokenCacheMock).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
