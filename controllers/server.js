const express = require("express");
const bodyParser = require("body-parser");
const {
  sendMessageAPI,
  receiveMessagesAPI,
  sendBulkMessageAPI,
} = require("./signalAPI");
const {
  listAccounts,
  deleteAccount,
  updateProfile,
  uploadAvatar,
} = require("./accountManager");
const { scheduleMessageAPI } = require("./scheduleMessage");
const { startAutoActivity } = require("./autoAccountActivity");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// 消息管理 API
app.post("/api/send-message", sendMessageAPI);
app.get("/api/get-messages", receiveMessagesAPI);
app.post("/api/send-bulk-message", sendBulkMessageAPI);

// 账户管理 API
app.get("/api/accounts", listAccounts);
app.delete("/api/accounts/:accountId", deleteAccount);
app.post("/api/accounts/update-profile", updateProfile);
app.post("/api/accounts/update-avatar", uploadAvatar);

// 定时消息 API
app.post("/api/schedule-message", scheduleMessageAPI);

// 自动养号功能 API
app.post("/api/auto-activity", (req, res) => {
  const { account, message, interval } = req.body;
  startAutoActivity(account, message, interval);
  res.json({ status: "Auto activity started" });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`Signal-CLI backend API running on http://localhost:${PORT}`);
});
