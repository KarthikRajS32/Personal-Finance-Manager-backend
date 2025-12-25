// const express = require("express");
// const usersController = require("../controllers/usersCtrl");
// const isAuthenticated = require("../middlewares/isAuth");

// const userRouter = express.Router();

// //! Register
// userRouter.post("/register", usersController.register);

// //! Login
// userRouter.post("/login", usersController.login);

// //! Profile
// userRouter.get("/profile", isAuthenticated, usersController.profile);

// //! Change password
// userRouter.put(
//   "/change-password",
//   isAuthenticated,
//   usersController.changeUserPassword
// );

// //! Update profile
// userRouter.put(
//   "/update-profile",
//   isAuthenticated,
//   usersController.updateUserProfile
// );

// module.exports = userRouter;


const express = require("express");
const usersController = require("../controllers/usersCtrl");
const isAuthenticated = require("../middlewares/isAuth");

const router = express.Router(); // ✅ use 'router' inside the file

// ✅ Register a new user
router.post("/register", usersController.register);

// ✅ User login
router.post("/login", usersController.login);

// ✅ Get user profile (protected)
router.get("/profile", isAuthenticated, usersController.profile);

// ✅ Change user password (protected)
router.put("/change-password", isAuthenticated, usersController.changeUserPassword);

// ✅ Update user profile (protected)
router.put("/update-profile", isAuthenticated, usersController.updateUserProfile);

// ✅ MFA routes
router.post("/setup-mfa", isAuthenticated, usersController.setupMFA);
router.post("/verify-mfa", isAuthenticated, usersController.verifyMFA);
router.post("/disable-mfa", isAuthenticated, usersController.disableMFA);

// ✅ Get user settings
router.get("/settings", isAuthenticated, usersController.getUserSettings);

module.exports = router; // ✅ export as 'router' — you can import as 'userRouter' in server.js
