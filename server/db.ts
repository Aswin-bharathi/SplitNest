import mongoose from 'mongoose';

export async function connectDb(uri: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  const dbName = mongoose.connection.db?.databaseName ?? 'unknown';
  console.log(`MongoDB connected to database: ${dbName}`);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}
