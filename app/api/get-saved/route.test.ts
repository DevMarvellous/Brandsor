import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUid = vi.fn();
vi.mock("@/lib/apiAuth", () => ({
  getUidFromBearer: () => mockGetUid(),
}));

const mockGet = vi.fn();
const mockCollection = vi.fn(() => ({
  where: () => ({
    orderBy: () => ({
      limit: () => ({
        get: mockGet,
      }),
    }),
  }),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  adminDb: {
    collection: () => mockCollection(),
  },
}));

import { GET } from "./route";

describe("GET /api/get-saved", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUid.mockReset();
    mockGet.mockReset();
  });

  it("returns 401 without valid bearer", async () => {
    mockGetUid.mockResolvedValue(null);
    const res = await GET(new Request("http://localhost/api/get-saved"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns saved names for authenticated user", async () => {
    mockGetUid.mockResolvedValue("user-1");
    mockGet.mockResolvedValue({
      docs: [
        {
          id: "d1",
          data: () => ({ name: "Acme", tagline: "Best", userId: "user-1" }),
        },
      ],
    });

    const res = await GET(new Request("http://localhost/api/get-saved"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.savedNames).toHaveLength(1);
    expect(body.savedNames[0].id).toBe("d1");
    expect(body.savedNames[0].name).toBe("Acme");
  });
});
