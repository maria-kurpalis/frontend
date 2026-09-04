# Resident and admin frontend

React + TypeScript, React Router, Axios, plain CSS and CSS Modules. Requires Node 22.12+.

## Run locally

From this `frontend` directory:

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173 and log in using one of the seeded demo emails displayed on the login page. The backend must already be running; its setup is documented in the [root README](../README.md).

The prototype uses email lookup as a demo identity flow. It does not implement production authentication.

## Email login

Enter only your email and press **Continue** or Enter. The server finds the account and determines its role; there is no role selector, ID input or password. Clicking a demo email fills the form without signing in automatically.

| Name | Email | Workspace |
| --- | --- | --- |
| Ananya Rao | ananya.rao@green-heights.example.test | Green Heights resident |
| Rohan Mehta | rohan.mehta@green-heights.example.test | Green Heights resident |
| Kavya Nair | kavya.nair@marina-residence.example.test | Marina resident |
| Arjun Iyer | arjun.iyer@marina-residence.example.test | Marina resident |
| Meera Desai | meera.desai@green-heights.example.test | Green Heights admin |
| Vikram Shah | vikram.shah@marina-residence.example.test | Marina admin |

These are actual deterministic seed emails. The login API is authoritative: missing accounts return a friendly error, and duplicate matches are rejected rather than choosing a role silently.

Residents go to `/resident/:residentId`; admins go to `/admin/:adminId/community/:communityId`. Existing request and configuration routes remain unchanged. The shared header displays the current name and **Logout**.

Only safe identity fields are stored in `sessionStorage` under `anacity.demoUser`. Refresh retains the identity within that tab. Logout removes it and returns to `/`; corrupt stored data is removed. Unauthenticated routes return to login; wrong-role or mismatched resident/admin/community IDs redirect to the stored identity's dashboard. `/admin` remains an alias to the appropriate entry/dashboard.

These route guards are demo UX protection. Storage can be edited and email ownership is not verified. The HTTP client uses the stored identity for existing actor headers, while backend services continue checking request ownership, community membership and permitted transitions. There are no passwords, tokens or server sessions.

To demonstrate both roles concurrently, log in separately in two tabs. To switch identities in one tab, use Logout and enter the other email.

## API configuration

`services/demoLoginApi.ts` uses the shared Axios instance from `services/http.ts`. `VITE_API_BASE_URL` should point to the API base including `/api`; it defaults to `/api`. Vite's development proxy targets `http://127.0.0.1:3000` unless `API_PROXY_TARGET` is set. Keep secrets out of all `VITE_*` settings. Example variables are in `.env.example`.

Login handles empty/invalid email, missing or ambiguous accounts, network errors and unexpected failures without showing SQL, stack traces or raw Axios errors. Continue is disabled during lookup and the form prevents duplicate submissions.

## Existing workflow

Moving company information is no longer collected or displayed. Supporting documents are optional in all four Green Heights and Marina Residence seed configurations. Requirements/progress still come from community configuration, and the generic document UI remains available when a resident wants to attach supporting material. See the [requirements update](../docs/retired-requirements.md) for current field lists and database handling.

Resident request creation, chat/manual fields, documents, submission, requested changes/resubmission, history, notifications and cancellation use the same services as before. Admin dashboards, review, verification, checklist/comments, AI assessment, independent decisions, completion, audit and workflow configuration are preserved.

AI remains advisory. If the provider is unavailable, manual resident/admin workflows remain usable. Files are URL references and notifications are database records only.

## Verification and demo

```sh
npm run build
```

The backend's `test:frontend` command runs login plus resident browser tests; `test:admin-frontend` runs admin workflow tests. Both exercise the actual API with an isolated seeded test database; only external AI is substituted. The login tests cover redirects, refresh, logout, role/ID restrictions, corrupt storage, friendly failures, keyboard submission and mobile layout. See the [root guide](../README.md) for test prerequisites and the [demo script](../docs/demo-script.md) for the workflow sequence.

Production hosting requires an SPA fallback and API proxy. Production identity would need real authentication, secure sessions/tokens, RBAC and expiration; none are implemented by this demo flow.
