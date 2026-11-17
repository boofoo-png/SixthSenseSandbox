// Target regions for onboarding step 2, from the team's Figma Make ("Who are you trying to reach?"):
// country, then province or state, then region, then subdivision. Lists are the Make's. Accented
// names are written with escapes because the code is kept ASCII (CLAUDE.md).

export type TargetRegion = { country: string; area: string; region: string; subdivision: string };

export const TARGET_COUNTRIES = [
  "Canada",
  "United States",
  "United Kingdom",
  "Australia",
  "Brazil",
  "France",
  "Germany",
  "India",
  "Italy",
  "Japan",
  "Mexico",
  "Netherlands",
  "New Zealand",
  "Singapore",
  "South Korea",
  "Spain",
  "United Arab Emirates",
] as const;

const AREAS: Record<string, readonly string[]> = {
  Canada: [
    "Alberta",
    "British Columbia",
    "Manitoba",
    "New Brunswick",
    "Newfoundland and Labrador",
    "Northwest Territories",
    "Nova Scotia",
    "Nunavut",
    "Ontario",
    "Prince Edward Island",
    "Quebec",
    "Saskatchewan",
    "Yukon",
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia",
    "Washington", "West Virginia", "Wisconsin", "Wyoming",
  ],
  "United Kingdom": ["England", "Northern Ireland", "Scotland", "Wales"],
  Australia: [
    "Australian Capital Territory",
    "New South Wales",
    "Northern Territory",
    "Queensland",
    "South Australia",
    "Tasmania",
    "Victoria",
    "Western Australia",
  ],
  Brazil: ["Central-West", "North", "Northeast", "South", "Southeast"],
  France: [
    "Auvergne-Rhône-Alpes",
    "Brittany",
    "Grand Est",
    "Hauts-de-France",
    "Île-de-France",
    "Normandy",
    "Nouvelle-Aquitaine",
    "Occitanie",
    "Pays de la Loire",
    "Provence-Alpes-Côte d’Azur",
  ],
  Germany: [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony",
    "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt",
    "Schleswig-Holstein", "Thuringia",
  ],
  India: [
    "Andhra Pradesh", "Delhi", "Gujarat", "Haryana", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Punjab",
    "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal",
  ],
  Italy: ["Emilia-Romagna", "Lazio", "Lombardy", "Piedmont", "Sardinia", "Sicily", "Tuscany", "Veneto"],
  Japan: ["Chubu", "Chugoku", "Hokkaido", "Kansai", "Kanto", "Kyushu and Okinawa", "Shikoku", "Tohoku"],
  Mexico: ["Central Mexico", "Gulf Coast", "Mexico City", "Northern Mexico", "Pacific Coast", "Yucatán Peninsula"],
  Netherlands: [
    "Drenthe", "Flevoland", "Friesland", "Gelderland", "Groningen", "Limburg", "North Brabant", "North Holland",
    "Overijssel", "South Holland", "Utrecht", "Zeeland",
  ],
  "New Zealand": ["North Island", "South Island"],
  Singapore: ["Central", "East", "North", "North-East", "West"],
  "South Korea": ["Busan", "Daegu", "Daejeon", "Gangwon", "Gwangju", "Gyeonggi", "Incheon", "Jeju", "Seoul", "Ulsan"],
  Spain: ["Andalusia", "Basque Country", "Canary Islands", "Catalonia", "Community of Madrid", "Galicia", "Valencian Community"],
  "United Arab Emirates": ["Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah", "Sharjah", "Umm Al Quwain"],
};

const CANADIAN_REGIONS: Record<string, readonly string[]> = {
  Alberta: ["Northern Alberta", "Central Alberta", "Calgary Region", "Edmonton Region", "Southern Alberta"],
  "British Columbia": ["Lower Mainland", "Fraser Valley", "Vancouver Island", "Thompson-Okanagan", "Northern British Columbia"],
  Manitoba: ["Winnipeg Capital Region", "Central Plains", "Interlake", "Northern Manitoba", "Westman"],
  "New Brunswick": ["Capital Region", "Fundy Coast", "Miramichi", "Northwest", "Southeast"],
  "Newfoundland and Labrador": ["Avalon Peninsula", "Central Newfoundland", "Western Newfoundland", "Labrador"],
  "Northwest Territories": ["Beaufort Delta", "Dehcho", "North Slave", "Sahtu", "South Slave"],
  "Nova Scotia": ["Annapolis Valley", "Cape Breton", "Halifax Region", "North Shore", "South Shore"],
  Nunavut: ["Kitikmeot", "Kivalliq", "Qikiqtaaluk"],
  Ontario: ["Greater Toronto Area", "Eastern Ontario", "Northern Ontario", "Southwestern Ontario", "Central Ontario"],
  "Prince Edward Island": ["Kings County", "Prince County", "Queens County"],
  Quebec: ["Greater Montréal", "Capitale-Nationale", "Eastern Quebec", "Northern Quebec", "Western Quebec"],
  Saskatchewan: ["Northern Saskatchewan", "Central Saskatchewan", "Regina Region", "Saskatoon Region", "Southern Saskatchewan"],
  Yukon: ["Whitehorse Region", "Klondike", "Kluane", "Northern Yukon", "Southeast Yukon"],
};

const SUBDIVISIONS: Record<string, readonly string[]> = {
  "Lower Mainland": ["Vancouver", "Burnaby", "Richmond", "North Shore", "Surrey and Delta"],
  "Fraser Valley": ["Abbotsford", "Chilliwack", "Langley", "Mission"],
  "Vancouver Island": ["Victoria", "Nanaimo", "Comox Valley", "Cowichan Valley"],
  "Greater Toronto Area": ["Toronto", "Durham", "Halton", "Peel", "York"],
  "Greater Montréal": ["Montréal", "Laval", "Longueuil", "North Shore", "South Shore"],
  "Calgary Region": ["Calgary", "Airdrie", "Cochrane", "Okotoks"],
  "Edmonton Region": ["Edmonton", "Leduc", "Sherwood Park", "St. Albert"],
  "Halifax Region": ["Halifax", "Dartmouth", "Bedford", "Sackville"],
  "Winnipeg Capital Region": ["Winnipeg", "East St. Paul", "Headingley", "Springfield"],
};

const DASH = " — ";

/** The label for the second level: province or territory, state, or state or region. */
export function areaLabel(country: string): string {
  if (country === "Canada") return "Choose a province or territory";
  if (country === "United States") return "Choose a state";
  return "Choose a state or region";
}

export function areasFor(country: string): readonly string[] {
  return AREAS[country] ?? [];
}

export function regionsFor(country: string, area: string): readonly string[] {
  if (!area) return [];
  if (country === "Canada") return CANADIAN_REGIONS[area] ?? [`All of ${area}`];
  const first = country === "United States" ? `Statewide${DASH}${area}` : `All of ${area}`;
  return [first, `Northern ${area}`, `Central ${area}`, `Southern ${area}`, `Major metro areas${DASH}${area}`];
}

export function subdivisionsFor(area: string, region: string): readonly string[] {
  if (!region) return [];
  return [
    `Any area in ${region}`,
    ...(SUBDIVISIONS[region] ?? [`Urban areas${DASH}${region}`, `Suburban areas${DASH}${region}`, `Rural areas${DASH}${region}`, `Any area in ${area}`]),
  ];
}

/** A country with its first province, region, and subdivision chosen, as the Make does on change. */
export function firstTargetRegion(country: string, area = areasFor(country)[0] ?? ""): TargetRegion {
  const region = regionsFor(country, area)[0] ?? "";
  return { country, area, region, subdivision: subdivisionsFor(area, region)[0] ?? "" };
}

/** True when every level is one of the choices offered under the level above it. */
export function isTargetRegion(value: unknown): value is TargetRegion {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Partial<TargetRegion>;
  return (
    typeof row.country === "string" &&
    typeof row.area === "string" &&
    typeof row.region === "string" &&
    typeof row.subdivision === "string" &&
    areasFor(row.country).includes(row.area) &&
    regionsFor(row.country, row.area).includes(row.region) &&
    subdivisionsFor(row.area, row.region).includes(row.subdivision)
  );
}
