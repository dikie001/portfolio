/**
 * Utility script to set the admin custom claim for a user.
 * 
 * Usage:
 * 1. Download your service account key from Firebase Console (Project Settings > Service Accounts).
 * 2. Save it as 'serviceAccountKey.json' in this folder.
 * 3. Run: node set-admin-claim.js <USER_EMAIL_OR_UID>
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const identifier = process.argv[2];

if (!identifier) {
  console.error('Please provide a user email or UID as an argument.');
  process.exit(1);
}

async function setAdminClaim(id) {
  try {
    let user;
    if (id.includes('@')) {
      user = await admin.auth().getUserByEmail(id);
    } else {
      user = await admin.auth().getUser(id);
    }

    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Successfully assigned admin claim to user: ${user.email} (${user.uid})`);
    console.log('The user will need to log out and log back in (or refresh their ID token) for the change to take effect.');
    process.exit(0);
  } catch (error) {
    console.error('Error setting admin claim:', error.message);
    process.exit(1);
  }
}

setAdminClaim(identifier);
