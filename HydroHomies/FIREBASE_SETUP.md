# 🔥 Firebase Setup Guide for HydroHype

This guide will walk you through creating and configuring a Firebase project for HydroHype from scratch.

## 📋 Quick Summary

If you already have a Firebase project, you just need to:
1. Enable Email/Password Authentication
2. Create Firestore Database
3. Update `app/services/firebase/config.ts` with your config values

If you're starting fresh, follow all steps below.

## Step 1: Create Firebase Project

1. **Go to Firebase Console**
   - Visit: https://console.firebase.google.com/
   - Sign in with your Google account

2. **Create a New Project**
   - Click **"Add project"** or **"Create a project"**
   - Enter project name: `hydrohype` (or any name you prefer)
   - Click **"Continue"**

3. **Configure Google Analytics (Optional)**
   - You can enable or disable Google Analytics
   - For development, it's optional - click **"Not now"** or **"Enable"** as you prefer
   - Click **"Create project"**

4. **Wait for Project Creation**
   - This takes about 30 seconds
   - Click **"Continue"** when ready

## Step 2: Add Web App to Firebase

1. **Add a Web App**
   - In your Firebase project dashboard, click the **Web icon** (`</>`) or **"Add app"** → **Web**
   - Register app nickname: `HydroHype Web` (optional)
   - **Important**: Check **"Also set up Firebase Hosting"** if you plan to deploy (optional for now)
   - Click **"Register app"**

2. **Copy Your Firebase Config**
   - You'll see a code snippet with your Firebase configuration
   - It looks like this:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSyASVhkeR4SIlgTpQUfDUeTkEeRBwvM4awc",
       authDomain: "hydrohype-9fa73.firebaseapp.com",
       projectId: "hydrohype-9fa73",
       storageBucket: "hydrohype-9fa73.firebasestorage.app",
       messagingSenderId: "1035226290940",
       appId: "1:1035226290940:web:7db3946b1d05691f471579",
       measurementId: "G-S1ZDRME8HR" // Optional, only if Analytics is enabled
     };
     ```
   - **Copy these values** - you'll need them in Step 5

3. **Click "Continue to console"**

## Step 3: Enable Authentication (Email/Password)

1. **Navigate to Authentication**
   - In the left sidebar, click **"Authentication"** (or use the ⚙️ menu)
   - Click **"Get started"** if you see it

2. **Enable Email/Password Sign-in**
   - Click on the **"Sign-in method"** tab (at the top)
   - Find **"Email/Password"** in the list
   - Click on it
   - **Toggle "Enable"** to ON
   - **Optional**: Enable "Email link (passwordless sign-in)" if you want (not required)
   - Click **"Save"**

✅ **Authentication is now enabled!**

## Step 4: Create Firestore Database

1. **Navigate to Firestore Database**
   - In the left sidebar, click **"Firestore Database"**
   - Click **"Create database"**

2. **Choose Security Rules**
   - Select **"Start in test mode"** (for development)
   - Click **"Next"**

3. **Choose Database Location**
   - Select a location closest to you (e.g., `us-central1`, `europe-west1`, etc.)
   - **Important**: Once set, you can't change this easily
   - Click **"Enable"**

4. **Wait for Database Creation**
   - This takes about 30 seconds
   - You'll see an empty Firestore database

### Configure Firestore Security Rules (Important!)

1. **Go to Firestore Rules**
   - Click on the **"Rules"** tab in Firestore Database

2. **Update Security Rules**
   - Replace the default rules with these:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own profile
       match /users/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can create hydration entries, read their own and limited leaderboard reads
       match /hydrationEntries/{entryId} {
         allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
         allow read: if request.auth != null && (resource.data.userId == request.auth.uid || request.query.limit <= 10);
         allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
       }
       
       // Users can read/write their own pet
       match /pets/{userId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

3. **Click "Publish"** to save the rules

## Step 5: Update Your App's Firebase Config

1. **Open Firebase Config File**
   - Open: `/app/services/firebase/config.ts`

2. **Replace the Config Values**
   - Replace the placeholder values with your actual Firebase config from Step 2:

   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY_HERE",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.appspot.com",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID",
   }
   ```

3. **Example with Real Values** (your project):
   ```typescript
   const firebaseConfig = {
     apiKey: "AIzaSyASVhkeR4SIlgTpQUfDUeTkEeRBwvM4awc",
     authDomain: "hydrohype-9fa73.firebaseapp.com",
     projectId: "hydrohype-9fa73",
     storageBucket: "hydrohype-9fa73.firebasestorage.app",
     messagingSenderId: "1035226290940",
     appId: "1:1035226290940:web:7db3946b1d05691f471579",
   }
   ```

4. **Save the file**

## Step 6: Verify Setup

1. **Check Firebase Console**
   - ✅ Authentication → Sign-in method → Email/Password should be **Enabled**
   - ✅ Firestore Database should be **Created**
   - ✅ Security rules should be **Published**

2. **Test in Your App**
   - Refresh your app (or restart the dev server)
   - The warning banner should disappear
   - Try logging in with:
     - Email: `test@example.com`
     - Password: `password123`
   - It should create an account automatically if the user doesn't exist

## Step 7: (Optional) Set Up Environment Variables

For production, use environment variables instead of hardcoding:

1. **Create `.env` file** in project root:
   ```
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyASVhkeR4SIlgTpQUfDUeTkEeRBwvM4awc
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=hydrohype-9fa73.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=hydrohype-9fa73
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=hydrohype-9fa73.firebasestorage.app
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1035226290940
   EXPO_PUBLIC_FIREBASE_APP_ID=1:1035226290940:web:7db3946b1d05691f471579
   ```

2. **Update `config.ts`** to use environment variables:
   ```typescript
   const firebaseConfig = {
     apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "your-api-key",
     authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
     // ... etc
   }
   ```

3. **Add `.env` to `.gitignore`** (if not already there)

## Troubleshooting

### "Firebase is not configured" warning still shows
- Make sure you've saved the config file
- Restart your dev server: `npm start -- --clear`
- Check that all values are replaced (not placeholder values)

### "auth/operation-not-allowed" error
- Go to Firebase Console → Authentication → Sign-in method
- Make sure Email/Password is **Enabled** (toggle ON)
- Click **Save**

### "Permission denied" in Firestore
- Check Firestore security rules are published
- Make sure you're logged in (Authentication is working)
- Verify the rules match the structure above

### Can't create database
- Make sure you're on the Blaze plan (pay-as-you-go) OR
- Use the free Spark plan (which should work for development)
- Some features require Blaze plan (but basic Firestore works on Spark)

### Config values not working
- Double-check you copied the values correctly (no extra spaces)
- Make sure you're using the **Web app** config (not iOS/Android)
- Verify the project ID matches in all fields

## Quick Checklist

- [ ] Firebase project created
- [ ] Web app added to Firebase
- [ ] Config values copied to `app/services/firebase/config.ts`
- [ ] Email/Password authentication enabled
- [ ] Firestore Database created
- [ ] Security rules configured and published
- [ ] App restarted/refreshed
- [ ] Test login works

## Next Steps

Once Firebase is set up:
1. ✅ Try logging in - it should create accounts automatically
2. ✅ Complete onboarding to set up your profile
3. ✅ Test the app features
4. ✅ Deploy to production when ready

## Firebase Console Links

- **Project Dashboard**: https://console.firebase.google.com/project/hydrohype-9fa73
- **Authentication**: https://console.firebase.google.com/project/hydrohype-9fa73/authentication
- **Firestore Database**: https://console.firebase.google.com/project/hydrohype-9fa73/firestore
- **Project Settings**: https://console.firebase.google.com/project/hydrohype-9fa73/settings/general

## Support

If you encounter issues:
1. Check Firebase Console for error messages
2. Check browser console for detailed errors
3. Verify all steps were completed
4. Make sure Email/Password auth is enabled
5. Ensure Firestore database is created

---

**Your Firebase project is ready! 🎉**
