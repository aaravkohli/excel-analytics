import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/excel-analytics-sphere';

async function createAdmin() {
  await mongoose.connect(MONGODB_URI);
  // Admin user creation
  const email = 'admin@example.com';
  const password = 'AdminPass123';
  const name = 'Admin User';

  // Check if admin already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin user already exists:', existing.email, 'role:', existing.role);
  } else {
    const hashedPassword = await bcrypt.hash(password, 12);
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      active: true
    });
    console.log('Admin user created:', admin.email, 'role:', admin.role);
  }

  // Demo user creation
  const demoEmail = 'demo-user@example.com';
  const demoPassword = 'demo123';
  const demoName = 'Demo User';
  const existingDemo = await User.findOne({ email: demoEmail });
  if (existingDemo) {
    console.log('Demo user already exists:', existingDemo.email, 'role:', existingDemo.role);
  } else {
    const hashedDemoPassword = await bcrypt.hash(demoPassword, 12);
    const demoUser = await User.create({
      name: demoName,
      email: demoEmail,
      password: hashedDemoPassword,
      role: 'demo',
      active: true
    });
    console.log('Demo user created:', demoUser.email, 'role:', demoUser.role);
  }
  await mongoose.disconnect();
}

createAdmin().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
}); 