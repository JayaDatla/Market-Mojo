import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
      : undefined;

    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      console.warn("Firebase service account not found. Attempting to use Application Default Credentials. This is expected for local development if service account is not set.");
      app = initializeApp();
    }
  } catch (error) {
    console.error("Firebase Admin initialization error:", error);
    // Fallback for environments where ADC or service account might not be configured
    // This allows the app to build but Firestore will fail at runtime if not configured
    if (!getApps().length) {
      app = initializeApp();
    } else {
      app = getApps()[0];
    }
  }
} else {
  app = getApps()[0];
}

db = getFirestore(app);

export { db, app as adminApp };
