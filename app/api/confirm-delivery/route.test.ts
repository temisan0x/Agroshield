type NextRequest = Request;

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
const mockGetUser = jest.fn();

jest.mock("@/lib/auth", () => ({
  getUser: mockGetUser,
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    case: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

let POST: (request: NextRequest) => Promise<Response>;

beforeAll(async () => {
  process.env.TRUSTLESS_WORK_API_KEY = "test-api-key";
  process.env.NEXT_PUBLIC_TRUSTLESS_WORK_API = "https://dev.api.trustlesswork.com";

  const route = await import("./route");
  POST = route.POST;
});

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
});

afterAll(() => {
  jest.resetAllMocks();
});

describe("POST /api/confirm-delivery", () => {
  it("returns 401 if no auth token", async () => {
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data).toEqual({ error: "Unauthorized" });
  });

  it("returns 403 if user role is not FARMER", async () => {
    mockGetUser.mockResolvedValue({ id: "vendor-1", role: "VENDOR" });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("returns 400 if caseId or contractId missing", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "caseId and contractId are required" });
  });

  it("returns 404 if case not found", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue(null);
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data).toEqual({ error: "Case not found" });
  });

  it("returns 403 if farmer doesn't own the case", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "other-farmer", status: "DELIVERED", escrow: { contractId: "contract-1" } });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data).toEqual({ error: "Forbidden" });
  });

  it("returns 400 if case status is not DELIVERED", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "farmer-1", status: "IN_PROGRESS", escrow: { contractId: "contract-1" } });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Only delivered cases can be confirmed" });
  });

  it("returns 400 if escrow contractId doesn't match", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "farmer-1", status: "DELIVERED", escrow: { contractId: "contract-2" } });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Escrow contract mismatch" });
  });

  it("returns 400 if farmer has no wallet address", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: null });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "farmer-1", status: "DELIVERED", escrow: { contractId: "contract-1" } });
    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data).toEqual({ error: "Missing farmer wallet address" });
  });

  it("returns approveXdr and releaseXdr on success", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "farmer-1", status: "DELIVERED", escrow: { contractId: "contract-1" } });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ unsignedTransaction: "approve-xdr" }),
    });
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({ unsignedTransaction: "release-xdr" }),
    });

    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1" }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ approveXdr: "approve-xdr", releaseXdr: "release-xdr" });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns 200 and flips case to COMPLETED when confirmed true", async () => {
    mockGetUser.mockResolvedValue({ id: "farmer-1", role: "FARMER", walletAddress: "GABC" });
    mockFindUnique.mockResolvedValue({ id: "case-1", farmerId: "farmer-1", status: "DELIVERED", escrow: { contractId: "contract-1" } });
    mockUpdate.mockResolvedValue({ id: "case-1", status: "COMPLETED" });

    const request = new Request("http://localhost/api/confirm-delivery", {
      method: "POST",
      headers: { Authorization: "Bearer token" },
      body: JSON.stringify({ caseId: "case-1", contractId: "contract-1", confirmed: true }),
    });

    const response = await POST(request as unknown as NextRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toMatchObject({
      message: "Delivery confirmed and funds released",
      case: { id: "case-1", status: "COMPLETED" },
    });
    expect(typeof data.case.updatedAt).toBe("string");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "case-1" },
      data: { status: "COMPLETED" },
      select: { id: true, status: true },
    });
  });
});
