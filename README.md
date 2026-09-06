# User-Authenticated Journal & Reflection AI with Google Maps & LinkedIn Integration

A secure, full-stack journaling, cognitive reflection, and professional sharing application powered by **Gemini 3.6 Flash**, **Cloud Firestore**, **Google Maps Platform**, and **LinkedIn API**, featuring federated **Firebase Authentication (Google Sign-In)** and strict user data isolation.

---

## Architecture & Security Overview

- **User Authentication**: Firebase Authentication via Google Sign-In (`signInWithPopup`). Outsources credential management securely; no passwords or emails are stored in custom application code.
- **Data Persistence**: Cloud Firestore storing user reflections under owner-isolated subcollections (`/users/{userId}/interactions/{interactionId}`).
- **Zero-Trust Firestore Security**: Evaluates `request.auth.uid == userId` on every read and write to mathematically prevent cross-user data leakage.
- **AI Processing Engine**: Server-side Express API proxy calling the Gemini API (`@google/genai` TypeScript SDK) with a 4-tier model fallback ladder:
  1. `gemini-3.6-flash` (Primary)
  2. `gemini-3.1-flash-lite` (High-Availability Fallback)
  3. `gemini-flash-latest` (Dynamic Alias)
  4. `gemini-3.7-flash` (Deep Reasoning Fallback)
- **Google Maps Integration (Pattern A Architecture)**: Secure server-side geocoding and Places search proxy (`/api/maps/*`) with in-memory TTL caching and strict field projection masking. Zero client-side API key leakage.
- **LinkedIn OAuth 2.0 & Sharing Architecture**: Backend-mediated OAuth 2.0 authorization code flow with cryptographic `state` verification, HTTP-Only SameSite/Secure session cookies, minimal permissions (`w_member_social`, `openid`, `profile`), and exponential backoff retry for rate limits.
- **Secret Isolation**: `GEMINI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `LINKEDIN_CLIENT_ID`, and `LINKEDIN_CLIENT_SECRET` are isolated to the server runtime environment and are never sent or exposed to client browsers.

---

## 5-Zone Agentic Threat Modeling & Countermeasure Matrix

| Threat Zone | Identified Risks & Attack Vectors | Architectural Countermeasures & Mitigations |
| :--- | :--- | :--- |
| **1. Input Surfaces** | Malicious journal prompts, prompt injection, untrusted geocoding payloads, malformed JSON | Strict schema validation with safe deserialization fallbacks; defensive payload destructuring; treating all external text as plain data. |
| **2. Planning & Reasoning** | System prompt hijacking, ungrounded advice, hallucinated tool calls | Structured system prompts enforcing reflection boundaries; resilient model fallback ladder (`gemini-3.6-flash` -> `gemini-3.1-flash-lite` -> `gemini-flash-latest` -> `gemini-3.7-flash`). |
| **3. Tool Execution** | SSRF, privilege escalation, unauthenticated API calls, credential exfiltration | Server-side gateway proxying all Maps, Gemini, and LinkedIn calls; zero client-side credential exposure; parameterization and whitelisting of external endpoints. |
| **4. Memory & State** | Cross-user data leakage, unauthorized Firestore writes, session hijacking | Owner-bound Firestore path validation (`request.auth.uid == userId`); undefined-stripping on payloads; SameSite/Secure HTTP-Only session cookies. |
| **5. Inter-System Communication** | Token interception, OAuth CSRF, API quota exhaustion, LinkedIn rate limiting | Cryptographic `state` validation on OAuth redirects; exponential backoff retry for HTTP 429; in-memory TTL caching for Maps queries; TLS 1.2+ over HTTPS. |

---

## 1. Prerequisites & Google Cloud Setup

Ensure you have the [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install) installed and authenticated.

```bash
# Log in to your Google Cloud account
gcloud auth login

# Set your target project ID
export PROJECT_ID="YOUR_PROJECT_ID"
export REGION="asia-southeast1" # or your preferred GCP region
gcloud config set project $PROJECT_ID

# Enable required Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  cloudbuild.googleapis.com
```

---

## 2. Secret Manager Configuration

Store your credentials in Google Cloud Secret Manager and grant access to the Cloud Run default compute service account:

```bash
# Retrieve your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# 1. Gemini API Key
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Google Maps API Key (Pattern A Server-Side Key)
gcloud secrets create GOOGLE_MAPS_API_KEY --replication-policy="automatic"
echo -n "YOUR_GOOGLE_MAPS_API_KEY" | gcloud secrets versions add GOOGLE_MAPS_API_KEY --data-file=-

# 3. LinkedIn OAuth Credentials
gcloud secrets create LINKEDIN_CLIENT_ID --replication-policy="automatic"
echo -n "YOUR_LINKEDIN_CLIENT_ID" | gcloud secrets versions add LINKEDIN_CLIENT_ID --data-file=-

gcloud secrets create LINKEDIN_CLIENT_SECRET --replication-policy="automatic"
echo -n "YOUR_LINKEDIN_CLIENT_SECRET" | gcloud secrets versions add LINKEDIN_CLIENT_SECRET --data-file=-

# Grant Cloud Run runtime service account permission to read secrets
for SECRET in GEMINI_API_KEY GOOGLE_MAPS_API_KEY LINKEDIN_CLIENT_ID LINKEDIN_CLIENT_SECRET; do
  gcloud secrets add-iam-policy-binding $SECRET \
    --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 3. Database Security Configuration (Cloud Firestore)

Ensure your database is provisioned in Firestore Native mode. Deploy the following security rules to enforce user data isolation:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Global default-deny safety net
    match /{document=**} {
      allow read, write: if false;
    }

    // Connectivity probe
    match /test/{docId} {
      allow read: if true;
    }

    // Strict user data isolation: Only the authenticated owner can access their interactions
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 4. Cloud Run Deployment Flow

Build and deploy the containerized full-stack application to Cloud Run:

```bash
# Deploy to Google Cloud Run from source
gcloud run deploy reflect-ai-app \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_MAPS_API_KEY=GOOGLE_MAPS_API_KEY:latest,LINKEDIN_CLIENT_ID=LINKEDIN_CLIENT_ID:latest,LINKEDIN_CLIENT_SECRET=LINKEDIN_CLIENT_SECRET:latest" \
  --port 3000
```

---

## 5. Mandatory Campaign Verification Labeling

Apply the required resource label to register the service for automated challenge verification:

```bash
gcloud run services update reflect-ai-app \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=$REGION
```

Verify that the label was correctly registered:
```bash
gcloud run services describe reflect-ai-app \
  --region=$REGION \
  --format="value(metadata.labels)"
```

---

## 6. Functional Test Walkthroughs & User Interaction Scenarios

The following test suites outline all interactive flows for automated verification:

### Test Suite 1: Authentication & Data Isolation
1. **Google Sign-In Trigger**: Click "Sign in with Google" on the landing page. Verify Firebase Auth opens a secure popup and redirects to the private dashboard upon success.
2. **Session Persistence**: Refresh the browser; confirm the authenticated state and user profile avatar persist.
3. **Cross-User Isolation**: Sign in as User A, create an entry, sign out, and sign in as User B. Confirm User B's history sidebar is completely empty and cannot read User A's Firestore records.

### Test Suite 2: Journaling & Gemini AI Interaction
1. **Create Reflection**: Select a Reflection Mode (e.g. *Reflection*, *Brainstorm*, *Summary*, or *Dialogue*). Type a journal entry and click "Reflect with Gemini".
2. **AI Generation & Fallback Ladder**: Verify the backend calls `gemini-3.6-flash` (or fallback models), returns formatted markdown takeaways, and saves the complete record directly to Firestore.
3. **Multi-Turn Continuity**: Type a follow-up query in the active conversation thread (e.g. *"Suggest 3 actionable next steps"*). Confirm that both user turns and Gemini responses are appended to the subcollection.

### Test Suite 3: Google Maps Location Pinning
1. **Device Geolocation**: Click "Use Current Location" in the location picker. Verify browser geolocation permissions prompt and the server returns a reverse-geocoded place name.
2. **Place Search & Pinning**: Type a place query (e.g., *"San Francisco Central Park"*), select a place from the dropdown, and submit the journal entry. Verify the pinned location badge and coordinate preview render on the active entry.

### Test Suite 4: LinkedIn Professional Sharing Flow
1. **Open Share Modal**: Click "Share to LinkedIn" in the active reflection view.
2. **Customize Post Elements**: Toggle inclusions for *My Reflection*, *AI Insights*, *Location*, and *Hashtags*. Edit commentary text in real-time.
3. **Connect Account**: Click "Connect Account" to launch the OAuth 2.0 authorization popup. Verify the callback exchanges code for token and updates the UI to "Connected".
4. **Publish Post**: Click "Publish to LinkedIn". Verify the post is created on the user's LinkedIn feed and a direct "View Post" link is returned.
5. **Fallback Options**: Test "Copy Text" and "Share on LinkedIn Web" buttons for non-OAuth manual sharing.
