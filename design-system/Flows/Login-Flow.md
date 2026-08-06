# Login Flow

**Entry point:** Unauthenticated user visits any route
**Exit point:** Authenticated user in dashboard
**Reference:** Design-System-v1.md §12 (Layout)

---

## Flow Diagram

```
Unauthenticated user
       │
       ▼
  Landing Page "/"
  ┌──────────────────────┐
  │  Navbar → [Sign In]   │
  │  Hero → [Get Started] │
  │  (Also: /login route) │
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │  Sign In Page        │
  │  /login or /sign-in   │
  │                       │
  │  ┌──────────────────┐│
  │  │ Email            ││
  │  │ Password         ││
  │  └──────────────────┘│
  │  [Sign In]            │
  │  "Forgot password?"   │
  │  "Don't have account? │
  │   Sign up"           │
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │  Onboarding (3 steps)│
  │  1. Writing Type      │
  │  2. Language          │
  │  3. Default Tone      │
  │  [Skip]               │
  └──────────────────────┘
       │
       ▼
  ┌──────────────────────┐
  │  Dashboard (Chat)    │
  │  /chat                │
  │                       │
  │  Conversation sidebar │
  │  Composer at bottom  │
  │  Context drawer      │
  └──────────────────────┘
```

---

## Step 1: Landing Page → Sign In

**Screen:** Landing Page
**Trigger:** Click "Sign In" in Navbar or "Get Started" in Hero

**Elements:**
- Navbar: "Sign In" button (top-right)
- Hero CTA: "Get Started" (gradient button)

**Behavior:**
- Routes to `/sign-in` (Clerk-managed auth page)
- Alternatively, "Get Started" routes to `/sign-up`

---

## Step 2: Sign In

**Screen:** `/login` or `/sign-in` (Clerk)
**Fields:** Email, Password

**Flow:**
1. User enters email and password
2. Click "Sign In"
3. System validates credentials via Clerk
4. On success → check if user has completed onboarding
5. On failure → show error toast, keep on page

**Edge cases:**
- Wrong credentials → error message below fields
- Unverified email → prompt to resend verification
- No account → link to sign-up

---

## Step 3: Onboarding (If First Login)

**Screen:** `/onboarding`
**Trigger:** First sign-in for new users

### Step 3a: Welcome

```
┌─────────────────────────────┐
│ ToneCraft                   │
│                             │
│  Welcome! Let's set up      │
│  your writing preferences.  │
│                             │
│  [ Skip for now ]  [ Next ] │
└─────────────────────────────┘
```

### Step 3b: Writing Type

```
┌─────────────────────────────┐
│ What kind of writing        │
│ do you do most?             │
│                             │
│  ○ Blog Posts               │
│  ○ Emails                    │
│  ○ Social Media             │
│  ○ Academic                 │
│  ○ Creative Writing         │
│                             │
│  [ Back ]  [ Next ]         │
└─────────────────────────────┘
```

### Step 3c: Language

```
┌─────────────────────────────┐
│ Primary Language            │
│                             │
│  [English ▼]                │
│  (Selects default model)    │
│                             │
│  [ Back ]  [ Next ]         │
└─────────────────────────────┘
```

### Step 3d: Default Tone

```
┌─────────────────────────────┐
│ Choose Your Default Tone    │
│                             │
│  Tone Chip: Friendly (green)│
│  Tone Chip: Professional     │
│  Tone Chip: Creative         │
│  ...                         │
│                             │
│  [ Back ]  [ Finish ]       │
└─────────────────────────────┘
```

**Rules:**
- Always provide "Skip" option
- Max 3 steps
- After onboarding → Navigate to `/chat`
- Onboarding outputs seed composer defaults

---

## Step 4: Post-Login Default

**Screen:** `/chat`
**Trigger:** Successful sign-in (with or without onboarding)

1. System fetches existing conversations
2. If conversations exist → show list, select most recent
3. If no conversations → show empty state ("Start a conversation" with "New Chat" button)
4. NavigationRail becomes visible
5. TopBar shows page title

---

## Error States

| Scenario | Handling |
|----------|----------|
| Invalid credentials | Error message below fields |
| Network error | Toast: "Network error, try again" |
| Clerk unavailable | Show retry on sign-in button |
| Session expired | Auto-redirect to sign-in page |
