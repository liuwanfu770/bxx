const { exec } = require("child_process");

// 发送单条消息 API
const sendMessageAPI = (req, res) => {
  const { account, recipient, message } = req.body;

  if (!account || !recipient || !message) {
    return res.status(400).json({ error: "缺少必要参数" });
  }

  exec(
    `signal-cli -u ${account} send ${recipient} -m "${message}"`,
    (err, stdout, stderr) => {
      if (err) {
        console.error(`Error: ${stderr}`);
        return res.status(500).json({ error: "消息发送失败" });
      }
      console.log(`Message Sent: ${stdout}`);
      res.json({ success: true, output: stdout });
    }
  );
};

// 接收消息 API
const receiveMessagesAPI = (req, res) => {
  const { account } = req.query;

  if (!account) {
    return res.status(400).json({ error: "缺少账号参数" });
  }

  exec(`signal-cli --config ${account} receive`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error receiving messages: ${stderr}`);
      return res.status(500).json({ error: "接收消息失败", details: stderr });
    }
    res.json({ messages: stdout });
  });
};

// 群发消息 API
const sendBulkMessageAPI = async (req, res) => {
  const { account, recipients, message } = req.body;

  if (
    !account ||
    !Array.isArray(recipients) ||
    recipients.length === 0 ||
    !message
  ) {
    return res.status(400).json({ error: "缺少必要参数" });
  }

  const failedRecipients = [];
  const successfulRecipients = [];

  // 遍历接收者列表，逐一发送消息
  for (const recipient of recipients) {
    try {
      await new Promise((resolve, reject) => {
        exec(
          `signal-cli -u ${account} send ${recipient} -m "${message}"`,
          (err, stdout, stderr) => {
            if (err) {
              console.error(
                `Failed to send message to ${recipient}: ${stderr}`
              );
              failedRecipients.push(recipient);
              reject(stderr);
            } else {
              console.log(`Message sent to ${recipient}: ${stdout}`);
              successfulRecipients.push(recipient);
              resolve(stdout);
            }
          }
        );
      });
    } catch (error) {
      console.error(`Error sending message to ${recipient}: ${error}`);
    }
  }

  res.json({
    success: successfulRecipients,
    failed: failedRecipients,
  });
};

// 导出模块
module.exports = {
  sendMessageAPI,
  receiveMessagesAPI,
  sendBulkMessageAPI,
};
