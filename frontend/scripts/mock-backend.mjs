/**
 * Contract conformance check.
 *
 * Serves responses shaped EXACTLY like the Spring Boot backend produces
 * (field names, enum values, LocalDateTime format, 204s, error envelope) and
 * runs the frontend's own api modules against it. Anything the frontend expects
 * that the backend doesn't send shows up here as a failure.
 *
 * This is a test harness only. It is never imported by the app.
 */
import http from "node:http";

const now = "2026-08-23T09:14:52.318";

const listingResponse = {
  id: "66b1f2c4e4b0a1d2c3e4f5a6",
  title: "Engineering Chemistry textbook",
  subject: "Engineering Chemistry",
  price: 450.0,
  type: "SALE",
  imageUrl:
    "https://res.cloudinary.com/demo/image/upload/w_200,h_400,c_limit,q_auto,f_auto/vitbookmart/listings/x.jpg",
  status: "AVAILABLE",
  createdAt: now,
  updatedAt: now,
};

const detailResponse = {
  id: "66b1f2c4e4b0a1d2c3e4f5a6",
  title: "Engineering Chemistry textbook",
  description: "Lightly used, no markings.",
  subject: "Engineering Chemistry",
  category: "BOOK",
  type: "RENT",
  price: 450.0,
  imageUrl: "https://res.cloudinary.com/demo/image/upload/vitbookmart/listings/x.jpg",
  unavailableExamSlots: ["A1", "C2", "G1"],
  status: "AVAILABLE",
  createdAt: now,
  updatedAt: now,
  seller: { name: "Tanishq", hostel: { type: "MH", block: "B", room: "412" } },
};

const userResponse = {
  id: "66b1f2c4e4b0a1d2c3e4f5b7",
  name: "Tanishq",
  email: "tanishq.2023@vitstudent.ac.in",
  whatsappNumber: "9876543210",
  hostel: { type: "MH", block: "B", room: "412" },
  status: "FREE",
  createdAt: now,
  updatedAt: now,
};

const paginated = (content) => ({
  content,
  page: 0,
  size: 12,
  totalElements: 1,
  totalPages: 1,
  first: true,
  last: true,
});

const errorResponse = (status, message, path) => ({
  timestamp: now,
  status,
  error: status === 400 ? "Bad Request" : "Not Found",
  message,
  path,
});

const seen = [];

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname;
  seen.push(`${req.method} ${path}${url.search}`);

  const json = (status, body) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(body));
  };

  // ---- auth -------------------------------------------------------------
  if (req.method === "POST" && path === "/api/auth/google") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw);
      if (!body.code) return json(400, errorResponse(400, "Authorization code is required", path));
      json(200, { accessToken: "access.jwt", refreshToken: "refresh.jwt", user: userResponse });
    });
    return;
  }

  if (req.method === "POST" && path === "/api/auth/refresh") {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw);
      // The real backend echoes the same refresh token back.
      json(200, {
        accessToken: "access.jwt.v2",
        refreshToken: body.refreshToken,
        user: userResponse,
      });
    });
    return;
  }

  // ---- listings ---------------------------------------------------------
  if (req.method === "GET" && path === "/api/listings/latest") return json(200, paginated([listingResponse]));
  if (req.method === "GET" && path === "/api/listings/search") return json(200, paginated([listingResponse]));
  if (req.method === "GET" && path === "/api/listings/contact/66b1f2c4e4b0a1d2c3e4f5a6")
    return json(200, { whatsappUrl: "https://wa.me/919876543210" });
  if (req.method === "GET" && path === "/api/listings/000000000000000000000000")
    return json(404, errorResponse(404, "Listing not found", path));
  if (req.method === "GET" && path.startsWith("/api/listings/")) return json(200, detailResponse);

  if (req.method === "POST" && path === "/api/listings/create") {
    const contentType = req.headers["content-type"] ?? "";
    let raw = Buffer.alloc(0);
    req.on("data", (chunk) => (raw = Buffer.concat([raw, chunk])));
    req.on("end", () => {
      const text = raw.toString("latin1");
      // Spring binds @RequestPart("listing") only if that part is application/json.
      const hasBoundary = /multipart\/form-data;\s*boundary=/.test(contentType);
      const listingPartIsJson = /name="listing"[\s\S]{0,120}?Content-Type:\s*application\/json/i.test(text);
      const hasImagePart = /name="image"/.test(text);
      json(201, {
        ...listingResponse,
        __check: { hasBoundary, listingPartIsJson, hasImagePart },
      });
    });
    return;
  }

  if (req.method === "PUT" && path.startsWith("/api/listings/update/")) return json(200, listingResponse);
  if (req.method === "PATCH" && path.startsWith("/api/listings/markSold/"))
    return json(200, { ...listingResponse, status: "SOLD" });

  // ---- users ------------------------------------------------------------
  if (req.method === "GET" && path === "/api/users/me") {
    if (req.headers.authorization !== "Bearer access.jwt") {
      // Spring Security returns an EMPTY body on 401.
      res.writeHead(401, { "WWW-Authenticate": 'Bearer error="invalid_token"' });
      return res.end();
    }
    return json(200, userResponse);
  }
  if (req.method === "PUT" && path === "/api/users/me/update") return json(200, userResponse);
  if (req.method === "GET" && path === "/api/users/my/listings") return json(200, [listingResponse]);

  // ---- wishlist ---------------------------------------------------------
  if (req.method === "GET" && path === "/api/wishlist/my") return json(200, { listings: [listingResponse] });
  if (req.method === "POST" && path.startsWith("/api/wishlist/add/")) {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "DELETE" && path.startsWith("/api/wishlist/remove/")) {
    res.writeHead(204);
    return res.end();
  }
  if (req.method === "DELETE" && path === "/api/wishlist/clear") return json(200, { listings: [] });

  json(404, errorResponse(404, "Not Found", path));
});

export { server, seen };
