const fs = require("fs");
const path = require("path");

// 定义目标结构
const TARGET_FOLDERS = {
  controllers: [".js"],      // 放控制器文件
  routes: [".js"],           // 放路由文件
  public: [".html", ".css"], // 放静态文件
  scripts: [".sh", ".bat"],  // 放脚本文件
  config: [".json", ".env"], // 放配置文件
};

// 创建目标文件夹
Object.keys(TARGET_FOLDERS).forEach((folder) => {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder); // 如果文件夹不存在则创建
  }
});

// 遍历当前目录的文件
fs.readdirSync(".").forEach((file) => {
  const ext = path.extname(file); // 获取文件扩展名
  const folder = Object.keys(TARGET_FOLDERS).find((key) =>
    TARGET_FOLDERS[key].includes(ext)
  );

  if (folder && fs.lstatSync(file).isFile()) {
    // 移动文件到对应的目标文件夹
    const targetPath = path.join(folder, file);
    fs.renameSync(file, targetPath);
    console.log(`Moved ${file} to ${folder}/`);
  }
});
