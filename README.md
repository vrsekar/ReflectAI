# User-Authenticated Journal & Reflection AI

A secure, full-stack journaling and cognitive reflection application powered by **Gemini 3.6 Flash** and **Cloud Firestore**, featuring federated **Firebase Authentication (Google Sign-In)** and strict user data isolation.

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
- **Secret Management**: `GEMINI_API_KEY` is isolated to the server runtime environment and is never sent or exposed to client browsers.

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

Store your Gemini API key in Google Cloud Secret Manager and grant access to the Cloud Run default compute service account:

```bash
# Retrieve your project number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Create and populate the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# Grant the Cloud Run runtime service account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
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
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \
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

## 6. Local Development

```bash
# Install dependencies
npm install

# Start development server with unified Express + Vite proxy
npm run dev

# Run type check and lint
npm run lint

# Build production bundle
npm run build

# Start production server
npm start
```
