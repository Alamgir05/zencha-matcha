# Zencha Matcha — Backend

Node.js + Express + MongoDB backend for the Zencha Matcha e-commerce site.

## Stack

- Node.js / Express
- MongoDB Atlas (free tier)
- JWT authentication
- bcryptjs for passwords

## Project Structure

```
backend/
├── controllers/
│   ├── authController.js
│   ├── productController.js
│   ├── cartController.js
│   ├── orderController.js
│   └── adminController.js
├── middleware/
│   └── auth.js
├── models/
│   ├── User.js
│   ├── Product.js
│   ├── Cart.js
│   └── Order.js
├── routes/
│   ├── auth.js
│   ├── products.js
│   ├── cart.js
│   ├── orders.js
│   └── admin.js
├── seed.js
├── server.js
├── package.json
└── .env.example
```

## API Endpoints

### Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/signup | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user (protected) |

### Products (public)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products/:id | Get single product |

### Cart (protected)
| Method | Route | Description |
|--------|-------|-------------|
| GET | /api/cart | Get user's cart |
| POST | /api/cart/add | Add item to cart |
| PUT | /api/cart/update | Update item quantity |
| DELETE | /api/cart/remove/:productId | Remove item |

### Orders (protected)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/orders | Create order from cart |
| GET | /api/orders | Get user's order history |
| GET | /api/orders/:id | Get single order |

### Admin (protected + isAdmin)
| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/admin/products | Create product |
| PUT | /api/admin/products/:id | Update product |
| DELETE | /api/admin/products/:id | Delete product |
| GET | /api/admin/orders | Get all orders |

---

## Local Setup

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/zencha?retryWrites=true&w=majority
JWT_SECRET=some_random_long_string_here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 3. Set up MongoDB Atlas (free)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **free tier cluster** (M0)
3. Go to **Database Access** → Add a database user with a password
4. Go to **Network Access** → Add `0.0.0.0/0` to allow all IPs (fine for dev/free tier)
5. Click **Connect** → **Connect your application** → copy the connection string
6. Replace `<username>` and `<password>` in the string and paste into your `.env`

### 4. Seed the database (optional)

```bash
node seed.js
```

This will add all the products that match the frontend cards.

### 5. Run the server

```bash
npm run dev    # development (nodemon)
npm start      # production
```

Server will run at `http://localhost:5000`

---

## Deploying to Render (FREE)

### Backend on Render

1. Push your code to GitHub (just the `backend/` folder, or the whole repo)
2. Go to [https://render.com](https://render.com) and sign up for free
3. Click **New** → **Web Service**
4. Connect your GitHub repo
5. Set the following:
   - **Root Directory**: `backend` (if the backend is in a subfolder)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node
6. Add environment variables under **Environment**:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = your secret
   - `CLIENT_URL` = your Netlify frontend URL
7. Click **Create Web Service**

Render will give you a URL like `https://zencha-backend.onrender.com` — use this as your frontend's API base URL.

> **Note:** Free Render services spin down after 15 minutes of inactivity. First request after idle may take ~30 seconds to wake up. That's fine for a student project.

### Connecting Frontend

In your frontend, set the API base URL:

```js
// src/api.js or wherever you call the backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

Add `VITE_API_URL=https://zencha-backend.onrender.com` to your Netlify environment variables.

---

## Making a User Admin

Currently there's no admin panel UI. To make a user admin manually:

1. Sign up through the API or frontend
2. Go to MongoDB Atlas → Browse Collections → Users
3. Find your user and set `isAdmin: true`

---

## Notes

- Passwords are hashed with bcryptjs (10 salt rounds)
- JWT tokens expire after 7 days
- Cart is stored in MongoDB, not localStorage
- Orders snapshot the product name/price at purchase time (so if price changes later, old orders are still accurate)
