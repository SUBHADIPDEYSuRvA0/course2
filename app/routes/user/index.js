const express = require("express");
const app = express.Router();


app.use("/", require("./user.pages.routes"));
app.use("/contact",require("./contacts"))
app.use("/auth",require("./uaerauth.routes"))
app.use("/payment",require("./payment.routes"))
app.use("/withdrawal",require("./withdrawal.routes"))
app.use("/enroll",require("./enrollroutes"))



// export the router
module.exports = app;