# Lassi Wassi

Full-stack food ordering app with a React/Vite frontend and a Node.js/Express backend backed by MongoDB Atlas.

## Project Structure

- `client/` - customer and owner-facing React app
- `server/` - Express API, MongoDB models, and Socket.IO notifications

## Requirements

- Node.js 18 or newer
- MongoDB Atlas database
- npm

## Backend Setup

1. Go to the `server/` folder.
2. Create a `.env` file from `server/.env.example` or update the existing one.
3. Set the following values:

```env
NODE_ENV=development
PORT=5000
MONGO_URI=your-mongodb-atlas-connection-string
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=your-secret-key
```

4. Install dependencies:

```bash
npm install
```

5. Seed the owner account:

```bash
npm run seed:owner
```

6. Seed the restaurant and menu items:

```bash
npm run seed:restaurant
```

7. Start the backend:

```bash
npm start
```

## Frontend Setup

1. Open a new terminal in the `client/` folder.
2. Install dependencies:

```bash
npm install
```

3. Start the frontend dev server:

```bash
npm run dev
```

The app should open on `http://localhost:5173`.

## Deploy the frontend to GitHub Pages

The GitHub Actions workflow in `.github/workflows/deploy-pages.yml` builds and deploys the React frontend whenever changes are pushed to `main`. In the repository settings, set **Pages → Build and deployment → Source** to **GitHub Actions**.

The Express API is not hosted by GitHub Pages. Deploy the `server/` app and its MongoDB database separately, then add the server's public URL as the repository Actions variable `VITE_API_URL` under **Settings → Secrets and variables → Actions → Variables**. The API server must allow the published Pages origin in its CORS configuration. Without `VITE_API_URL`, the frontend uses `http://localhost:5000`, which only works during local development.

The workflow supports both project Pages URLs and user or organization Pages URLs, and publishes a fallback page so direct navigation to app routes works.

## Testing the App

1. Open the customer site in the browser.
2. Verify that restaurants and menu items load from the backend.
3. Register or log in as a customer.
4. Add menu items to the cart and place an order.
5. Log in as the owner using the seeded owner account.
6. Update the order status to `out_for_delivery` and confirm the customer gets the notification.

## Seeded Owner Login

- Email: `owner@lassiwassi.com`
- Password: `Owner@123`

## Notes

- Do not commit real production secrets into `.env`.
- The `server/.env` file is ignored by git.
- If notifications do not appear, ensure the browser has permission to show notifications and the backend is running on port `5000`.
