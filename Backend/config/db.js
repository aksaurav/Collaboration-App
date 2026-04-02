import mongoose from "mongoose";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the environment variables.");
    }

    // 2. Connection Logic
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // 3. Detailed Error Logging
    console.error(`❌ Database Connection Failed: ${error.message}`);

    // Exit process with failure
    process.exit(1);
  }
};

export default connectDB;
