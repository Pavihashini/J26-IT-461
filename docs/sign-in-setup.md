# SmartPlate sign-in setup

The sign-in page supports password login, Remember me, read-only guest browsing,
registration, Google Identity Services and email password recovery.

## Google sign-in

1. Open [Google Cloud Console](https://console.cloud.google.com/) and choose or create a project.
2. Configure the OAuth consent screen, app name and audience. If the app is in testing mode,
   add the Google accounts that will test it to the test-user list.
3. Create an OAuth client of type **Web application**.
4. Add both development origins to **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
5. Copy the client ID to `backend/.env`:

   ```dotenv
   GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

This implementation uses Google's JavaScript credential callback and verifies the
ID token on the backend. A client secret or redirect URI is not needed for this flow.
Restart the backend after changing the environment. The sign-in page obtains the
public client ID from `/api/auth/capabilities` and loads Google's official button.
Add your production origin separately when deploying.

Google accounts sign in as customers. Administrator accounts continue to use password
login. A matching existing account can be linked only when Google is authoritative
for its verified Gmail or Workspace email. Other existing email accounts must use
password login. Google-created accounts have a random, unknown password; password
recovery can set one later.

Official references: [client setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid),
[server verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token).

## Password reset email

Obtain SMTP credentials and an approved sender address from your email provider.
Set the following in **`backend/.env`**, not in the frontend or chat:

```dotenv
FRONTEND_URL=http://localhost:5173
SMTP_HOST=your-provider-smtp-host
SMTP_PORT=587
SMTP_USERNAME=your-smtp-username
SMTP_PASSWORD=your-smtp-password
SMTP_FROM=your-approved-sender@example.com
SMTP_USE_SSL=false
```

Port 587 uses STARTTLS. If your provider requires implicit TLS on port 465,
use `SMTP_PORT=465` and `SMTP_USE_SSL=true`.
Set `FRONTEND_URL` to the actual frontend origin users open; use HTTPS in production.
Reset links always use this server-controlled origin. Restart the backend.

The request response does not disclose whether an account exists. Reset links expire
after 15 minutes. Updating the password invalidates the link, other outstanding reset
links and previously issued access tokens. Requests are limited per email/IP in the
current backend process. Use a shared rate-limit store when deploying multiple workers.
SMTP delivery failures are logged without email addresses, reset links or credentials.
Check the backend's delivery warnings if a configured provider does not deliver mail.

Until credentials are configured, the UI explicitly reports that the corresponding
service is unavailable. No reset tokens are exposed in API responses or browser logs.

## Local verification

### Gmail shortcut

The local `.env` is prepared with `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`
and `SMTP_USE_SSL=false`.

1. Enable [2-Step Verification](https://myaccount.google.com/security) for the Gmail sender account.
2. Open [App passwords](https://myaccount.google.com/apppasswords), create one named
   `SmartPlate`, and copy the generated app password.
3. In `backend/.env`, set `SMTP_USERNAME` and `SMTP_FROM` to that Gmail address.
4. Set `SMTP_PASSWORD` to the generated app password, without display spaces.
   Do not use your normal Google password or share the app password in chat.
5. Restart the backend after filling in these values.

See [Google's app-password instructions](https://support.google.com/accounts/answer/185833).
Some managed or specially secured accounts do not offer app passwords; use the
sender account's available authentication options in that case.

## Run the tests

```powershell
cd backend
.\.venv313\Scripts\python.exe -m pip install -r requirements-dev.txt
.\.venv313\Scripts\python.exe -m unittest tests.test_account_access.AccountAccessTest
```

Tests use SQLite and mock Google verification/email delivery. Actual Google sign-in
and email delivery require your external credentials and an end-to-end provider test.

Remember me stores the existing eight-hour access token in local storage. Otherwise
it is stored in tab session storage. This does not extend the token's expiry.
