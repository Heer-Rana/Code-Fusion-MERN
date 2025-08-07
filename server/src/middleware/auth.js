const User = require("../models/User");

const requireAuth = async (req, res, next) => {
  try {
    if (!req.session?.userId) {
      return res.status(401).json({ message: "Authentication required" })
    }

    const user = await User.findById(req.session.userId).select("-password")
    if (!user) {
      req.session.destroy((err) => {
        if (err) console.error("Session destroy error:", err)
      })
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user
    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(500).json({ message: "Authentication error" })
  }
}
module.exports = { requireAuth };
