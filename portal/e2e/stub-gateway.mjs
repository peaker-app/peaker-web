import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = JSON.parse(readFileSync(join(here, "fixtures.json"), "utf8"));
const port = Number(process.env.STUB_GATEWAY_PORT ?? 8080);

const peak = {
  id: fixtures.peakId,
  name: fixtures.peakName,
  altitudeMeters: fixtures.peakAltitudeMeters,
  prominenceMeters: 2812,
  latitude: 42.6319,
  longitude: 0.6577,
  countryCode: "ES",
  region: "Pyrenees",
  imageUrl: null,
};

const longNamePeak = {
  ...peak,
  id: fixtures.longNamePeakId,
  name: fixtures.longNamePeakName,
};

const unnamedPeak = {
  ...peak,
  id: fixtures.unnamedPeakId,
  name: fixtures.unnamedPeakWikidataId,
};

const paged = (items, size = 24) => ({
  items,
  page: 1,
  size,
  totalCount: items.length,
  totalPages: items.length === 0 ? 0 : 1,
});

const detail = {
  ...peak,
  rangeId: null,
  rangeName: "Pyrenees",
  alternativeNames: [
    { languageCode: "es", name: fixtures.localizedPeakName, isOfficial: true },
    { languageCode: "fr", name: "Pic d'Aneto", isOfficial: false },
  ],
};

const bareDetail = {
  ...peak,
  id: fixtures.barePeakId,
  prominenceMeters: null,
  region: null,
  countryCode: null,
  imageUrl: null,
  rangeId: null,
  rangeName: null,
  alternativeNames: [],
};

const unnamedDetail = {
  ...unnamedPeak,
  rangeId: null,
  rangeName: null,
  alternativeNames: [],
};

const profile = {
  userId: fixtures.userId,
  displayName: fixtures.climberName,
  slug: fixtures.climberSlug,
  bio: "Pirineos y Alpes.",
  avatarUrl: null,
  countryCode: "ES",
  stats: {
    totalAscents: 12,
    distinctPeaks: 9,
    highestAltitudeMeters: peak.altitudeMeters,
    highestPeakId: peak.id,
    highestPeakName: peak.name,
    lastAscentDate: "2026-07-20",
  },
};

const ascentSummary = {
  id: fixtures.ascentId,
  peakId: peak.id,
  peakName: peak.name,
  peakAltitudeMeters: peak.altitudeMeters,
  ascentDate: "2026-07-20",
  visibility: "Public",
  thumbnailUrl: null,
};

const ascent = {
  ...ascentSummary,
  userId: profile.userId,
  companions: "Ana, Luis",
  routeNotes: fixtures.routeNotes,
  conditions: { snow: "Patchy", wind: "Moderate", trail: null },
  photos: [],
};

const notFound = (title) => ({ status: 404, body: { title } });
const problem = (status, title) => ({ status, body: { title } });

const collectionPeak = {
  id: "77777777-7777-7777-7777-777777777777",
  peakId: fixtures.otherPeakId,
  peakName: fixtures.otherPeakName,
  peakAltitudeMeters: peak.altitudeMeters,
  addedAtUtc: "2026-07-20T10:00:00Z",
};

const defaultCollection = {
  id: fixtures.defaultCollectionId,
  name: "Want to climb",
  description: null,
  kind: "WantToClimb",
  peakCount: 1,
};

const customCollection = {
  id: fixtures.customCollectionId,
  name: fixtures.customCollectionName,
  description: "Los de los Pirineos.",
  kind: "Custom",
  peakCount: 1,
};

const collectionDetail = (summary) => ({
  ...summary,
  peaks: paged([collectionPeak], 20),
});

const readBody = async (request) => {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return {};
  }
};

const register = (body) =>
  body.username === fixtures.takenUsername
    ? problem(409, "User.UsernameAlreadyRegistered")
    : { status: 202, body: null };

const initialRefreshToken = "refresh-token";
const rotatedRefreshToken = "rotated-refresh-token";

const accessTokenFor = (secondsToLive) =>
  `header.${Buffer.from(
    JSON.stringify({
      sub: fixtures.userId,
      email: fixtures.validEmail,
      exp: Math.floor(Date.now() / 1000) + secondsToLive,
    }),
  ).toString("base64url")}.signature`;

const tokenPair = (refreshToken) => ({
  accessToken: accessTokenFor(900),
  refreshToken,
  expiresInSeconds: 900,
  tokenType: "Bearer",
});

const login = (body) =>
  body.password === fixtures.validPassword
    ? tokenPair(initialRefreshToken)
    : problem(401, "User.InvalidCredentials");

const refresh = (body) =>
  body.refreshToken === initialRefreshToken ||
  body.refreshToken === rotatedRefreshToken
    ? tokenPair(rotatedRefreshToken)
    : problem(401, "RefreshToken.InvalidOrExpired");

const confirmEmail = (body) => {
  if (body.token === fixtures.confirmedToken) {
    return problem(409, "User.EmailAlreadyConfirmed");
  }

  return body.token === fixtures.validToken
    ? { status: 204, body: null }
    : problem(400, "EmailConfirmation.InvalidOrExpired");
};

const forgotPassword = () => ({ status: 202, body: null });

const resetPassword = (body) =>
  body.token === fixtures.validToken
    ? { status: 204, body: null }
    : problem(400, "PasswordReset.InvalidOrExpired");

const bodyRoutes = [
  [/^\/api\/auth\/register/, register],
  [/^\/api\/auth\/login/, login],
  [/^\/api\/auth\/refresh/, refresh],
  [/^\/api\/auth\/email\/confirm/, confirmEmail],
  [/^\/api\/auth\/password\/forgot/, forgotPassword],
  [/^\/api\/auth\/password\/reset/, resetPassword],
];

const saveSlug = async (url, request) => {
  const body = await readBody(request);

  return body.slug === fixtures.takenSlug
    ? problem(409, "Profile.SlugAlreadyTaken")
    : { status: 204, body: null };
};

const createCollection = async (url, request) => {
  const body = await readBody(request);

  return body.name === fixtures.takenCollectionName
    ? problem(409, "Collection.NameAlreadyUsed")
    : { status: 201, body: fixtures.customCollectionId };
};

const addCollectionPeak = async (url, request) => {
  const body = await readBody(request);

  return body.peakId === fixtures.barePeakId
    ? problem(409, "Collection.PeakAlreadyAdded")
    : {
        status: 201,
        body: {
          id: crypto.randomUUID(),
          peakId: body.peakId,
          peakName:
            body.peakId === fixtures.otherPeakId ? fixtures.otherPeakName : peak.name,
          peakAltitudeMeters: peak.altitudeMeters,
          addedAtUtc: new Date().toISOString(),
        },
      };
};

const methodRoutes = [
  ["POST", /^\/api\/collections\/[0-9a-f-]{36}\/peaks$/, addCollectionPeak],
  ["DELETE", /^\/api\/collections\/[0-9a-f-]{36}\/peaks\/[0-9a-f-]{36}$/, () => ({
    status: 204,
    body: null,
  })],
  ["POST", /^\/api\/collections$/, createCollection],
  ["PUT", /^\/api\/collections\/[0-9a-f-]{36}$/, () => ({ status: 204, body: null })],
  ["DELETE", /^\/api\/collections\/[0-9a-f-]{36}$/, () => ({ status: 204, body: null })],
  ["PUT", /^\/api\/profiles\/me\/slug$/, saveSlug],
  ["PUT", /^\/api\/profiles\/me$/, () => ({ status: 204, body: null })],
  ["POST", /^\/api\/profiles\/me\/avatar$/, () => ({
    status: 200,
    body: { avatarUrl: "https://res.cloudinary.com/demo/avatar.jpg" },
  })],
  ["DELETE", /^\/api\/profiles\/me\/avatar$/, () => ({ status: 204, body: null })],
  ["DELETE", /^\/api\/auth\/me$/, () => ({ status: 204, body: null })],
  ["POST", /^\/api\/ascents\/[0-9a-f-]{36}\/photos$/, () => ({
    status: 201,
    body: {
      id: crypto.randomUUID(),
      secureUrl: "https://res.cloudinary.com/demo/photo.jpg",
      width: 1200,
      height: 900,
      position: 0,
      uploadedAtUtc: new Date().toISOString(),
    },
  })],
  ["DELETE", /^\/api\/ascents\/[0-9a-f-]{36}\/photos\/[0-9a-f-]{36}$/, () => ({
    status: 204,
    body: null,
  })],
  ["POST", /^\/api\/ascents$/, () => ({ status: 201, body: fixtures.ascentId })],
  ["PUT", /^\/api\/ascents\/[0-9a-f-]{36}$/, () => ({ status: 204, body: null })],
  ["DELETE", /^\/api\/ascents\/[0-9a-f-]{36}$/, () => ({ status: 204, body: null })],
];

const searchResults = (query) => {
  if (query === fixtures.emptyQuery) {
    return [];
  }

  return query === fixtures.longNameQuery ? [longNamePeak] : [peak];
};

const routes = [
  [
    new RegExp(`^/api/collections/${fixtures.defaultCollectionId}`),
    () => collectionDetail(defaultCollection),
  ],
  [
    new RegExp(`^/api/collections/${fixtures.customCollectionId}`),
    () => collectionDetail(customCollection),
  ],
  [/^\/api\/collections\/[0-9a-f-]{36}/, () => notFound("Collection.NotFound")],
  [/^\/api\/collections/, () => paged([defaultCollection, customCollection], 20)],
  [/^\/api\/profiles\/me\/stats/, () => profile.stats],
  [/^\/api\/profiles\/me/, () => ({
    id: fixtures.userId,
    userId: fixtures.userId,
    displayName: fixtures.climberName,
    slug: fixtures.climberSlug,
    bio: profile.bio,
    avatarUrl: null,
    countryCode: "ES",
    visibility: "Public",
  })],
  [/^\/api\/ascents$/, () => paged([ascentSummary], 20)],
  [/^\/api\/auth\/email\/resend/, () => ({ status: 204, body: null })],
  [/^\/api\/auth\/logout/, () => ({ status: 204, body: null })],
  [
    /^\/api\/peaks\/search/,
    (url) => paged(searchResults(url.searchParams.get("q"))),
  ],
  [
    /^\/api\/peaks\/nearby/,
    () =>
      paged(
        [
          { ...peak, distanceMeters: 4200 },
          { ...unnamedPeak, distanceMeters: 9100 },
        ],
        20,
      ),
  ],
  [new RegExp(`^/api/peaks/${fixtures.missingPeakId}`), () => notFound("Peak.NotFound")],
  [new RegExp(`^/api/peaks/${fixtures.barePeakId}`), () => bareDetail],
  [new RegExp(`^/api/peaks/${fixtures.unnamedPeakId}`), () => unnamedDetail],
  [/^\/api\/peaks\/[0-9a-f-]{36}/, () => detail],
  [/^\/api\/peaks/, () => paged([peak])],
  [/^\/api\/profiles\/by-slug\/missing/, () => notFound("Profile.NotFound")],
  [/^\/api\/profiles\/by-slug\//, () => profile],
  [/^\/api\/profiles\/[0-9a-f-]{36}/, () => profile],
  [/^\/api\/ascents\/by-user\//, () => paged([ascentSummary], 20)],
  [new RegExp(`^/api/ascents/${fixtures.ascentId}`), () => ascent],
  [/^\/api\/ascents\/[0-9a-f-]{36}/, () => notFound("Ascent.NotFound")],
];

const resolve = async (request, url) => {
  const byMethod = methodRoutes.find(
    ([method, pattern]) => method === request.method && pattern.test(url.pathname),
  );

  if (byMethod) {
    return byMethod[2](url, request);
  }

  const withBody = bodyRoutes.find(([pattern]) => pattern.test(url.pathname));

  if (withBody) {
    return withBody[1](await readBody(request));
  }

  const match = routes.find(([pattern]) => pattern.test(url.pathname));

  return match ? match[1](url) : notFound("NotStubbed");
};

createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://localhost:${port}`);

  void resolve(request, url).then((result) => {
    const status = result.status ?? 200;
    const body = result.body === undefined ? result : result.body;

    response.writeHead(status, { "Content-Type": "application/json" });
    response.end(body === null ? undefined : JSON.stringify(body));
  });
}).listen(port, () => {
  process.stdout.write(`stub gateway listening on ${port}\n`);
});
