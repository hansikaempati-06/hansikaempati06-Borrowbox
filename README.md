# BorrowBox — GenAI-Powered Campus Resource Sharing System

A full-stack web application that lets college students share and borrow resources (textbooks, calculators, electronics, lab equipment, and more) with AI-powered recommendations.

## Problem Statement

Students often need textbooks, calculators, electronics, lab equipment, and study materials temporarily but don't know who has them or where to find them. BorrowBox provides a centralized campus resource-sharing platform where students can list, search, borrow, and return resources — with Generative AI to intelligently recommend resources based on natural-language requirements.

## Objectives

- Provide a centralized platform for campus resource sharing
- Enable students to list, search, borrow, and return resources
- Use Generative AI to recommend resources based on natural-language queries
- Use AI to automatically categorize resources when adding them
- Maintain a borrowing history for accountability
- Provide a simple management dashboard for administrators

## Features

- **Home Page**: Landing page with statistics, navigation, and overview
- **Resource Dashboard**: Browse, search, filter, and sort all resources
- **Add Resource**: Form with AI-powered category suggestion
- **Borrow Workflow**: Borrow available resources with student details and return date
- **Return Workflow**: Return borrowed resources and auto-create history records
- **AI Assistant**: Natural-language resource recommendations powered by OpenAI
- **AI Categorization**: Automatic category suggestion when adding resources
- **Borrowing History**: Complete transaction history with on-time/late indicators
- **Management Dashboard**: Add, edit, delete, and manage all resources
- **Responsive Design**: Works seamlessly on mobile and desktop

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Tailwind CSS, TypeScript |
| Backend/Database | Supabase, PostgreSQL |
| AI | OpenAI API (gpt-4o-mini) |
| Icons | Lucide React |
| Deployment | Bolt.new |

## Architecture

```
User
  ↓
React Frontend (Vite + Tailwind)
  ↓
Backend / API Layer (Supabase Edge Functions)
  ↓
Supabase Database (PostgreSQL)
```

### AI Workflow

```
User Requirement (natural language)
  ↓
React Frontend sends requirement to Edge Function
  ↓
Edge Function fetches available resources from Supabase
  ↓
Edge Function constructs structured prompt with resource list
  ↓
OpenAI API analyzes requirement + available resources
  ↓
AI returns structured JSON recommendations
  ↓
Edge Function validates resource IDs against database
  ↓
Frontend displays validated recommendations as cards
```

## Database Schema

### `resources` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated unique ID |
| name | text | Resource name |
| category | text | One of: Books, Calculators, Electronics, Lab Equipment, Stationery, Study Materials, Other |
| description | text | Resource description |
| owner_name | text | Name of the resource owner |
| owner_id | text | Student ID of the owner |
| owner_contact | text | Contact info (email/phone) |
| condition | text | New, Good, Fair, or Used |
| availability_status | text | Available or Borrowed |
| borrower_name | text | Name of current borrower (nullable) |
| borrower_id | text | Student ID of borrower (nullable) |
| borrowed_at | timestamptz | When the resource was borrowed (nullable) |
| expected_return_date | date | Expected return date (nullable) |
| created_at | timestamptz | When the resource was listed |

### `borrowing_history` table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Auto-generated unique ID |
| resource_id | uuid (FK) | Reference to resources table |
| resource_name | text | Name of the resource (denormalized) |
| borrower_name | text | Name of the borrower |
| borrower_id | text | Student ID of the borrower |
| borrowed_at | timestamptz | When the resource was borrowed |
| returned_at | timestamptz | When the resource was returned |
| expected_return_date | date | Expected return date |

### RLS Policies

Both tables have Row Level Security enabled with full CRUD access for `anon` and `authenticated` roles, as this is a shared campus resource platform (single-tenant, no authentication required for the prototype).

## AI Workflow Details

### AI Recommendation (Edge Function: `ai-recommend`)

1. User types a natural-language requirement (e.g., "I need help preparing for DBMS")
2. The edge function fetches all currently available resources from the database
3. A structured system prompt is sent to OpenAI with the available resource list
4. OpenAI returns JSON with recommended resource IDs and reasons
5. The edge function validates each resource ID exists and is available
6. Only validated recommendations are returned to the frontend
7. The frontend displays recommendation cards with resource details and AI reasons

**System Prompt Rules:**
- Recommend only resources from the provided list
- Never invent resources
- Never recommend unavailable resources
- Return structured JSON
- Explain why each resource is relevant

### AI Categorization (Edge Function: `ai-categorize`)

1. User enters resource name and description
2. The edge function sends this to OpenAI with the predefined category list
3. OpenAI returns the best-matching category
4. The category is validated against the allowed list
5. User can accept or override the suggestion

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
# Supabase (pre-populated in Bolt)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Key (stored as Supabase Edge Function secret, never exposed to frontend)
OPENAI_API_KEY=sk-your-openai-api-key
```

**Important:** The OpenAI API key is stored as a Supabase Edge Function secret and is only accessed server-side. It is NEVER exposed in frontend code.

## Setup Instructions

### Prerequisites

- Node.js 18+
- A Supabase project
- An OpenAI API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Supabase credentials
4. Set the `OPENAI_API_KEY` as an Edge Function secret in your Supabase project dashboard
5. Run the database migrations (the `resources` and `borrowing_history` tables)
6. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

This project is designed to be deployed on Bolt.new. The Supabase backend (database + edge functions) is already provisioned. The frontend builds to static files that can be served by any static hosting provider.

## AI Evaluation

### Test Cases

**Test 1:** "I need help preparing for DBMS."
- **Expected:** Recommends DBMS textbook, DBMS notes, or related study materials if available.
- **Criteria:** Relevance to DBMS, correct resource IDs, no hallucinated resources.

**Test 2:** "I need something for Java programming."
- **Expected:** Recommends Java textbook, Java practice workbook if available.
- **Criteria:** Relevance to Java, accurate resource matching.

**Test 3:** "I need a resource that does not exist."
- **Expected:** AI responds that no suitable resource is currently available.
- **Criteria:** No fabricated resources, clear "no match" message.

**Test 4:** "I need an electronic device for a presentation."
- **Expected:** Recommends HDMI adapter, Arduino, or other available electronics.
- **Criteria:** Correct category matching, relevance to presentations.

### Evaluation Criteria

| Criterion | Description |
|-----------|-------------|
| Relevance | Recommendations match the user's stated need |
| Accuracy | Resource IDs correspond to real, available resources |
| No Hallucination | AI never invents resources that don't exist |
| Correct IDs | All recommended resource IDs are valid |
| Explanations | Each recommendation includes a clear reason |
| Unavailable Handling | Borrowed resources are never recommended |

## Limitations

- AI functionality requires an active OpenAI API key and network access
- AI response quality depends on prompt design and available inventory
- OpenAI API usage may have cost/token limits
- The current version primarily supports English
- Authentication is simplified for the prototype (no login required)
- The application depends on the availability of the AI API
- Designed for campus/small-scale use
- Concurrency control uses optimistic checking (re-fetch before borrow)

## Future Scope

- User authentication with Supabase Auth (student accounts)
- Real-time notifications when resources become available
- Rating and review system for resources and borrowers
- Request/wishlist feature for resources not yet listed
- Mobile app (React Native)
- Multi-campus support
- AI-powered demand prediction
- Automated reminders for overdue returns
- QR code-based borrow/return tracking
