import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/codefusion"

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI)

    console.log(`✅ MongoDB connected`)
    console.log(`   Host: ${mongoose.connection.host}`)
    console.log(`   Database: ${mongoose.connection.name}`)

    // Optional event listeners for logging
    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB connection error:", err)
    })

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected")
    })
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:", error)
    process.exit(1)
  }
}
