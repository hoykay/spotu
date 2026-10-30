# SpotU

**What belongs here?**

SpotU is a location opportunity agent powered by Qloo cultural intelligence. It helps founders, operators, and property decision-makers evaluate which business concepts culturally fit a location — and where relative market gaps may exist.

**Live demo:** https://spotu-delta.vercel.app

Built for the **Qloo Agentic Hackathon**.

---

## The problem

Choosing what business belongs in a neighborhood is usually based on fragmented research, intuition, competitor searches, and generic demographic data.

Those methods can describe a place, but they do not necessarily explain its cultural character or compare multiple business concepts against that character.

SpotU turns Qloo cultural signals into a clear decision workflow:

**Location → Cultural DNA → Concept Evaluation → Market Gap → Ranked Recommendation**

---

## What SpotU does

Enter a location and SpotU:

1. Finds nearby places using Qloo.
2. Extracts recurring cultural signals from those places.
3. Builds a Neighborhood DNA profile.
4. Evaluates eight business concepts against those signals.
5. Measures relative local representation for each concept.
6. Combines cultural alignment and market gap into an Opportunity Score.
7. Ranks the concepts and recommends what fits best.
8. Explains the strongest signals behind the recommendation.

Users can also:

- compare the same concept across two locations
- save location analyses
- explore a location directly on Mapbox
- see a nearby Qloo place and image
- review how SpotU reached its recommendation

---

## Why Qloo matters

SpotU is not using Qloo simply to decorate a recommendation.

Qloo is the core intelligence source used to understand the cultural character of a location.

For each analysis, the server queries Qloo's `/v2/insights` endpoint for up to **20 nearby place entities within a 1,500 metre radius**.

SpotU then analyzes relevant Qloo tags including signals related to:

- ambience
- neighborhood characteristics
- decor
- culinary style
- interests
- place categories

Recurring signals become the location's **Neighborhood DNA**.

---

## How SpotU decides

SpotU currently evaluates eight concepts:

- Restaurant
- Café
- Bar / Wine
- Retail
- Wellness
- Entertainment
- Art & Culture
- Lifestyle

Each concept has a defined set of cultural signals and relevant place categories.

### Cultural Fit Index

The Cultural Fit Index represents the strength of the most prominent recurring cultural signals found across nearby Qloo places.

It is designed to indicate how strongly a location expresses a recognizable cultural identity.

### Cultural Match

For each business concept, SpotU measures how strongly that concept's expected signals appear across nearby Qloo places.

For example, a concept may align with signals such as:

`walkable`, `central`, `social`, `lively`, `trendy`

The resulting percentage becomes the **Cultural Match**.

### Market Gap Signal

SpotU also checks how many nearby Qloo places already match each business concept.

Concept saturation is calculated from:

`nearby matching places / total nearby Qloo places`

The Market Gap Signal is then:

`100 - saturation`

A higher Market Gap Signal means the concept is relatively less represented among the nearby Qloo places analyzed.

**Important:** Market Gap Signal does not represent commercial vacancy, available real estate, guaranteed demand, or financial viability.

### Opportunity Score

SpotU combines the two signals using:

`Opportunity Score = 65% Cultural Match + 35% Market Gap Signal`

The concepts are then ranked from highest to lowest Opportunity Score.

This allows SpotU to balance:

**Does this concept culturally belong here?**

with:

**How represented is this concept already nearby?**

---

## Agent decision flow

SpotU follows a structured decision pipeline:

```text
User selects a location
        ↓
Mapbox resolves coordinates
        ↓
SpotU queries nearby Qloo places
        ↓
Qloo cultural tags are aggregated
        ↓
Neighborhood DNA is created
        ↓
8 business concepts are evaluated
        ↓
Cultural Match is calculated
        ↓
Local concept saturation is measured
        ↓
Market Gap Signal is calculated
        ↓
Opportunity Scores are ranked
        ↓
SpotU recommends the strongest opportunity
        ↓
Supporting signals are shown to the user
```

The recommendation screen exposes this process through **How SpotU decided**, making the decision easier to inspect rather than presenting an unexplained score.

---

## Compare locations

SpotU can evaluate the same business concept across two different locations.

For example:

**Restaurant in SoHo vs. Lower East Side**

SpotU compares:

- Cultural Fit
- concept Opportunity Score
- strongest supporting cultural signals

and identifies which location is the stronger fit.

---

## Technology

SpotU is built with:

- **Next.js 16**
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **Qloo API**
- **Mapbox GL JS**
- **Lucide React**
- **Vercel**

---

## Architecture

```text
Browser
  │
  ├── Mapbox
  │     ├── location search
  │     ├── reverse geocoding
  │     └── interactive map
  │
  └── Next.js application
          │
          └── /api/analyze
                  │
                  ├── Qloo /v2/insights
                  │
                  ├── cultural signal aggregation
                  │
                  ├── concept evaluation
                  │
                  ├── market-gap calculation
                  │
                  └── ranked recommendation
```

The **Qloo API key remains server-side** inside the Next.js API route and is never exposed to the browser.

The Mapbox public token is used client-side for map and geocoding functionality.

---

## Running SpotU locally

Clone the repository:

```bash
git clone https://github.com/hoykay/spotu.git
cd spotu
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file:

```text
QLOO_API_KEY=your_qloo_api_key
QLOO_BASE_URL=https://hackathon.api.qloo.com
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_public_token
```

Then start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

For a production build:

```bash
npm run build
npm start
```

---

## Privacy and API security

SpotU does not commit API credentials to the repository.

Environment files are excluded through `.gitignore`.

The Qloo API key is accessed only from the server-side `/api/analyze` route.

---

## Current scope

SpotU is a hackathon MVP focused on demonstrating how cultural intelligence can support location-level business concept decisions.

The current Market Gap Signal measures **relative representation inside the nearby Qloo place set**. It should be treated as an opportunity signal rather than a substitute for commercial real-estate, financial, demographic, or demand due diligence.

---

## License

SpotU is released under the MIT License.