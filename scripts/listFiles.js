import mongoose from 'mongoose';
import dotenv from 'dotenv';
import File from '../src/models/file.model.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in .env');
  process.exit(1);
}

async function listFiles() {
  await mongoose.connect(MONGODB_URI);
  const files = await File.find({}, 'originalName filename uploadedBy createdAt processingStatus');
  console.log('All files:');
  files.forEach(f => {
    console.log(`- ${f.originalName} (stored: ${f.filename}) | uploadedBy: ${f.uploadedBy} | status: ${f.processingStatus} | created: ${f.createdAt}`);
  });
  await mongoose.disconnect();
}

listFiles().catch(err => {
  console.error('Error listing files:', err);
  process.exit(1);
}); 