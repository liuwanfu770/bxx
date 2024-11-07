require("dotenv").config();
const axios = require("axios");

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;
const SITE_KEY = "5fad97ac-7d06-4e44-b18a-b950b20148ff";
const SIGNAL_URL = "https://signalcaptchas.org/registration/generate";

async function solveCaptcha() {
  console.log("1. 开始获取 hCaptcha 验证...");
  const response = await axios.post("https://api.2captcha.com/createTask", {
    clientKey: CAPTCHA_API_KEY,
    task: {
      type: "HCaptchaTaskProxyless",
      websiteURL: SIGNAL_URL,
      websiteKey: SITE_KEY,
    },
  });

  if (response.data.errorId) {
    throw new Error(`2Captcha 错误: ${response.data.errorDescription}`);
  }

  const taskId = response.data.taskId;

  for (let i = 0; i < 30; i++) {
    console.log(`轮询第 ${i + 1} 次...等待 CAPTCHA 结果`);
    await new Promise((resolve) => setTimeout(resolve, i < 15 ? 10000 : 20000));

    const result = await axios.post("https://api.2captcha.com/getTaskResult", {
      clientKey: CAPTCHA_API_KEY,
      taskId: taskId,
    });

    if (result.data.status === "ready") {
      const captchaToken = `signal-hcaptcha.${SITE_KEY}.registration.${result.data.solution.token}`;
      console.log("成功获取 captchaToken:", captchaToken);
      return captchaToken;
    } else {
      console.log("CAPTCHA 结果未就绪，继续等待...");
    }
  }

  throw new Error("Captcha 验证超时");
}

(async function () {
  try {
    const captchaToken = await solveCaptcha();
    console.log("成功获取 captchaToken:", captchaToken);
  } catch (error) {
    console.error("Captcha 验证失败:", error.message);
  }
})();
