require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const CAPTCHA_API_KEY = process.env.CAPTCHA_API_KEY;
const SMS_ACTIVATE_API_KEY = process.env.SMS_ACTIVATE_API_KEY;
const SIGNAL_CLI_PATH = "signal-cli";
const SITE_KEY = "5fad97ac-7d06-4e44-b18a-b950b20148ff";
const SIGNAL_URL = "https://signalcaptchas.org/registration/generate";
const SERVICE_ID = "525228";
const COUNTRY = 5;
const PROVIDER = "selfsms";

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
      // 修改格式为以 "signal-hcaptcha" 开头的格式
      const captchaToken = `signal-hcaptcha.${SITE_KEY}.registration.${result.data.solution.token}`;
      console.log("成功获取 captchaToken:", captchaToken);

      return captchaToken;
    } else {
      console.log("CAPTCHA 结果未就绪，继续等待...");
    }
  }

  throw new Error("Captcha 验证超时");
}

async function getVirtualNumber() {
  console.log("2. 开始获取虚拟号码...");
  const response = await axios.get(
    `https://lubansms.com/v2/api/getNumber?apikey=${SMS_ACTIVATE_API_KEY}&service_id=${SERVICE_ID}&country=${COUNTRY}&provider=${PROVIDER}`
  );
  if (response.data.code === 0) {
    console.log("成功获取虚拟号码:", response.data.number);
    return {
      phoneNumber: response.data.number,
      requestId: response.data.request_id,
    };
  }
  throw new Error("获取虚拟号码失败");
}

async function registerSignal(phoneNumber, captchaToken) {
  console.log("3. 提交 Signal 注册请求...");
  const command = `${SIGNAL_CLI_PATH} -u ${phoneNumber} register --captcha "${captchaToken}"`;

  console.log("执行命令:", command);

  try {
    const output = execSync(command, { stdio: "pipe" }).toString();
    if (!output.trim()) {
      console.log("注册请求成功，无内容返回表示已成功注册");
    } else {
      console.log("注册返回信息:", output);
    }
  } catch (error) {
    if (error.toString().includes("StatusCode: 429")) {
      console.error("注册请求过于频繁，请稍后重试");
      await new Promise((resolve) => setTimeout(resolve, 3600000));
      throw new Error("注册请求频率限制");
    }
    console.error("Signal 注册流程失败，详细错误信息:", error.message);
    throw new Error("注册流程失败");
  }
}

async function getSmsCode(requestId) {
  console.log("4. 等待短信验证码...");
  for (let i = 0; i < 12; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    const response = await axios.get(
      `https://lubansms.com/v2/api/getSms?apikey=${SMS_ACTIVATE_API_KEY}&request_id=${requestId}&json=1`
    );
    if (response.data.code === 0 && response.data.sms) {
      console.log("收到短信验证码:", response.data.sms);
      return response.data.sms;
    }
    console.log(`尚未收到短信验证码，重试次数：${i + 1}`);
  }
  throw new Error("接收短信验证码超时");
}

async function verifyCode(phoneNumber, smsCode) {
  console.log("5. 提交验证码进行验证...");
  const command = `${SIGNAL_CLI_PATH} -u ${phoneNumber} verify ${smsCode}`;
  try {
    const output = execSync(command, { stdio: "pipe" }).toString();
    if (!output.trim()) {
      console.log("验证码验证成功，无内容返回表示验证成功");
    } else {
      console.log("验证返回信息:", output);
    }
    fs.appendFileSync(
      path.join(__dirname, "account3", "accounts.txt"),
      `${phoneNumber}\n`,
      "utf8"
    );
    console.log(`账号 ${phoneNumber} 已成功注册并存入文件`);
  } catch (error) {
    console.error("验证码验证失败:", error.message);
    throw new Error("验证码验证失败");
  }
}

async function listIdentities(phoneNumber) {
  console.log("6. 检查身份状态...");
  const command = `${SIGNAL_CLI_PATH} -u ${phoneNumber} listIdentities`;
  try {
    const output = execSync(command, { encoding: "utf8" });
    console.log("身份状态信息:", output);
  } catch (error) {
    console.error("身份状态检查失败:", error.message);
  }
}

(async function () {
  try {
    const captchaToken = await solveCaptcha();
    const { phoneNumber, requestId } = await getVirtualNumber();
    await registerSignal(phoneNumber, captchaToken);
    const smsCode = await getSmsCode(requestId);
    await verifyCode(phoneNumber, smsCode);
    await listIdentities(phoneNumber);
    console.log("注册流程完成！");
  } catch (error) {
    if (error.message.includes("频率限制")) {
      console.log("等待一段时间后重试注册...");
      await new Promise((resolve) => setTimeout(resolve, 3600000));
    } else {
      console.error("注册流程失败:", error.message);
    }
  }
})();
