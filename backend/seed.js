// Run this once to seed some products into the DB
// node seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const Product = require('./models/Product');

const products = [
  {
    name: 'Everyday Matcha',
    description: 'Smooth and versatile for lattes, baking, and smoothies.',
    price: 18,
    image: '/ceremonial_matcha.png',
    stock: 100,
    category: 'matcha'
  },
  {
    name: 'Seiun Matcha',
    description: 'Balanced sweetness with a lingering finish, perfect for daily ceremony.',
    price: 26,
    image: '/matcha_starter_kit.png',
    stock: 60,
    category: 'matcha'
  },
  {
    name: 'Ceremonial Grade Matcha',
    description: 'The pinnacle of matcha craftsmanship. First harvest, shade-grown, stone-milled to order.',
    price: 32,
    image: '/hero_matcha_bowl.png',
    stock: 40,
    category: 'ceremonial'
  },
  {
    name: 'Bamboo Whisk',
    description: 'Traditional 80-prong chasen.',
    price: 16,
    image: '/matcha_tools.png',
    stock: 200,
    category: 'accessories'
  },
  {
    name: 'Matcha Mug',
    description: 'Hand-thrown chawan bowl.',
    price: 22,
    image: '/matcha_relax.png',
    stock: 80,
    category: 'accessories'
  },
  {
    name: 'Matcha Latte Mix',
    description: 'Ceremonial matcha and oat milk powder — just add water.',
    price: 19,
    image: '/matcha_latte.png',
    stock: 150,
    category: 'blends'
  },
  {
    name: 'Matcha Cake Powder',
    description: 'Vibrant culinary-grade matcha perfect for baking.',
    price: 23,
    image: '/matcha_cake.png',
    stock: 120,
    category: 'blends'
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    await Product.deleteMany({});
    console.log('Cleared old products');

    await Product.insertMany(products);
    console.log('Seeded', products.length, 'products');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
}

seed();
