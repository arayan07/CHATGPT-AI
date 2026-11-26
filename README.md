# Study Assistant + Private Chat

A mobile-friendly study-question website with a separate, Firebase-authenticated two-person chat.

## Important setup

The website starts in Study Mode. The Private Chat button opens a sign-in form. The two people must have separate Firebase Authentication accounts. The database rules allow only the two exact Firebase user IDs that you add below.

**Do not put a shared chat password or private API key in the website code.** A password stored in frontend JavaScript can be viewed by anyone. This project uses Firebase Authentication and Firestore rules instead.

## 1. Create a Firebase project

1. Open https://console.firebase.google.com/ and create a project.
2. In Project settings, add a Web App and copy its Firebase configuration.
3. Open `app.js` and replace the `PASTE_...` values in `firebaseConfig`.
4. In Firebase Console > Authentication > Sign-in method, enable **Email/Password**.
5. In Authentication > Users, create the two accounts (one for each person). Use separate passwords and don't share account credentials.
6. Copy each account's **User UID** from the Users page.

## 2. Set up Firestore security

1. In Firebase Console, create a Cloud Firestore database.
2. Open the Rules tab.
3. Paste the contents of `firestore.rules`.
4. Replace `PASTE_FIRST_USER_UID` and `PASTE_SECOND_USER_UID` with the two actual UIDs.
5. Publish the rules.

Do not use open rules such as `allow read, write: if true`. Those would expose the conversation.

## 3. Test locally

Because this uses browser ES modules, run it from a local web server rather than opening `index.html` as a file. For example, use VS Code Live Server, or run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## 4. Publish with GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, `app.js`, and the other project files.
3. Open repository Settings > Pages.
4. Under Build and deployment, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. Wait for GitHub Pages to publish the site.

## How it works

- Study Mode contains a small starter bank of Class 10 and Class 12 Science questions. Add more questions in the `questionBank` object in `app.js`.
- Private Chat uses Firebase Authentication and Cloud Firestore real-time updates.
- Each person signs in with their own account.
- The chat screen is gated by a per-tab session flag and the app signs out when you lock or leave the page. Browser lifecycle events are best-effort; for stronger protection, always use the Lock button and keep Firebase rules restrictive.
- Messages are stored in Firestore until deleted from the Firebase console. This starter version does not include photo or voice uploads.

## Privacy note

A ChatGPT-like visual style does not make this website ChatGPT. The site is a study interface with a separate private chat feature. Use it responsibly and do not rely on the appearance of a page as a security measure.
