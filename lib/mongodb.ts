import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI!;

if (!MONGO_URI) {
    throw new Error("Please provide MONGO_URI in the environment variables");
}

// Global Cache
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { promise: null, conn: null };
}

export async function connectDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGO_URI!, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000,
        }).then((mongoose) => {
            console.log("MongoDB connected");
            return mongoose;
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

