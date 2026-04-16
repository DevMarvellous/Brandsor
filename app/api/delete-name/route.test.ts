import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUid = vi.fn();
vi.mock("@/lib/apiAuth", () => ({
  getUidFromBearer: () => mockGetUid(),
}));

const mockGet = vi.fn();
const mockDelete = vi.fn();
const mockDoc = vi.fn(() => ({
  get: mockGet,
  delete: mockDelete,
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  adminDb: {
    collection: () => ({
      doc: mockDoc,
    }),
  },
}));

import { DELETE } from "./route";

describe("DELETE /api/delete-name", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUid.mockReset();
    mockGet.mockReset();
    mockDelete.mockReset();
    mockDoc.mockClear();
  });

  it("returns 400 without id", async () => {
    mockGetUid.mockResolvedValue("u1");
    const res = await DELETE(
      new Request("http://localhost/api/delete-name")
    );
    expect(res.status).toBe(400);
  });

  it("returns 401 without auth", async () => {
    mockGetUid.mockResolvedValue(null);
    const res = await DELETE(
      new Request("http://localhost/api/delete-name?id=x")
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when document belongs to another user", async () => {
    mockGetUid.mockResolvedValue("u1");
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "u2" }),
    });

    const res = await DELETE(
      new Request("http://localhost/api/delete-name?id=doc1")
    );
    expect(res.status).toBe(403);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it("deletes when owner matches", async () => {
    mockGetUid.mockResolvedValue("u1");
    mockGet.mockResolvedValue({
      exists: true,
      data: () => ({ userId: "u1" }),
    });
    mockDelete.mockResolvedValue(undefined);

    const res = await DELETE(
      new Request("http://localhost/api/delete-name?id=doc1")
    );
    expect(res.status).toBe(200);
    expect(mockDelete).toHaveBeenCalled();
  });
});
