# Onboarding Flow

**Trigger:** First successful sign-in for a new user
**Route:** `/onboarding`
**Reference:** Design-System-v1.md §17 (Final Principles)

---

## Flow Diagram

```
Sign-in complete
       │
       ▼
  ┌──────────────────┐
  │ System checks    │
  │ onboarding flag  │
  │                  │
  │ First login?     │
  │ Yes → show       │
  │ No → skip to     │
  │ /chat            │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Step 1: Welcome  │
  │ "Let's set up    │
  │ your preferences"│
  │                  │
  │ [Skip] [Next]    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Step 2: Writing  │
  │ Type             │
  │                  │
  │ ○ Blog Posts     │
  │ ○ Emails         │
  │ ○ Social Media   │
  │ ○ Academic       │
  │ ○ Creative       │
  │                  │
  │ [Back] [Next]    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Step 3: Language │
  │                  │
  │ [English ▼]      │
  │ (Dropdown)       │
  │                  │
  │ [Back] [Next]    │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Step 4: Default  │
  │ Tone             │
  │                  │
  │ Tone Chips (9)   │
  │ [Pick one]       │
  │                  │
  │ [Back] [Finish]  │
  └──────────────────┘
       │
       ▼
  ┌──────────────────┐
  │ Store prefs →    │
  │ /chat            │
  └──────────────────┘
```

---

## Detailed Steps

### Step 1: Welcome

**Screen:** `/onboarding` (step 0)
**Purpose:** Sets expectations, lets user skip immediately

**Elements:**
- Headline: "Welcome to ToneCraft"
- Subheadline: "Let's set up your writing preferences to get you started."
- "Skip for now" button (top-right, small)
- "Next" button (primary, gradient)

**Behavior:**
- Progress indicator: dots at top (● ○ ○ ○)
- Skip → bypass all steps, go to `/chat` with defaults

---

### Step 2: Writing Type

**Screen:** `/onboarding` (step 1)
**Purpose:** Pre-seed tone and model defaults

**Options:**
| Option | Suggested Tone | Model |
|--------|---------------|-------|
| Blog Posts | Professional | GPT-4o |
| Emails | Friendly | GPT-4o |
| Social Media | Creative | GPT-4o |
| Academic | Academic | GPT-4o |
| Creative Writing | Creative | GPT-4o |

**Behavior:**
- Single-select radio buttons
- Selection highlights with tone color
- "Back" returns to Welcome
- "Next" saves selection and advances

---

### Step 3: Language

**Screen:** `/onboarding` (step 2)
**Purpose:** Set language for composer defaults

**Elements:**
- Label: "What's your primary language?"
- Dropdown with common languages (English, Spanish, French, etc.)
- Default: English
- Description: "This helps us pick the right model and tone suggestions."

**Behavior:**
- Saves to user preferences
- "Back" returns to Writing Type
- "Next" saves and advances

---

### Step 4: Default Tone

**Screen:** `/onboarding` (step 3)
**Purpose:** Seed the tone bar in composer

**Elements:**
- Tone chips showing all 9 tones with color indicators
- Single-select
- Preview: clicking a tone shows a brief description

**Behavior:**
- Save to user preferences as `defaultTone`
- "Back" returns to Language
- "Finish" saves all preferences and redirects to `/chat`

---

## Skip Path

If user skips onboarding:
1. All values set to defaults
2. Default tone: Friendly
3. Default model: GPT-4o
4. Language: English
5. Redirect to `/chat`

---

## Data Storage

All onboarding selections stored in:
- `PATCH /api/user/profile` — sets `writingType`, `language`, `defaultTone`
- Preferences accessible via `GET /user` (Clerk + app metadata)

---

## Rules

- Maximum 3 steps (Welcome counts as step 0)
- "Skip" available on every step
- After completion → redirect to `/chat`
- Onboarding outputs seed composer defaults
- Rail (NavigationRail) visible from first authenticated screen
