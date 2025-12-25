const jwt = require("jsonwebtoken");

const isAuthenticated = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token provided, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "masynctechKey");
    req.user = decoded.id;

    next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: "Token expired or invalid, please login again" });
  }
};

module.exports = isAuthenticated;
