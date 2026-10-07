import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, getDocuments, search, uploadDocument } from "./api";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: `status ${status}`,
    json: async () => body,
  } as Response);
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("getDocuments returns parsed directory response", async () => {
    const payload = { total: 0, departments: [], documents: [] };
    vi.stubGlobal("fetch", mockFetch(200, payload));
    await expect(getDocuments()).resolves.toEqual(payload);
  });

  it("getDocuments appends the department filter", async () => {
    const spy = mockFetch(200, { total: 0, departments: [], documents: [] });
    vi.stubGlobal("fetch", spy);
    await getDocuments("Finance");
    expect(spy).toHaveBeenCalledWith(
      expect.stringContaining("/documents?department=Finance"),
      undefined,
    );
  });

  it("search encodes the query and limit", async () => {
    const spy = mockFetch(200, { query: "x", answer: null, results: [] });
    vi.stubGlobal("fetch", spy);
    await search("vendor policy", 5);
    const url = spy.mock.calls[0][0] as string;
    expect(url).toContain("q=vendor+policy");
    expect(url).toContain("limit=5");
  });

  it("throws ApiError with backend detail on non-2xx", async () => {
    vi.stubGlobal("fetch", mockFetch(400, { detail: "Only .md files are accepted." }));
    const file = new File(["x"], "notes.txt", { type: "text/plain" });
    await expect(uploadDocument(file)).rejects.toMatchObject({
      status: 400,
      message: "Only .md files are accepted.",
    });
  });

  it("throws a connection ApiError when fetch rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    await expect(getDocuments()).rejects.toBeInstanceOf(ApiError);
  });
});
