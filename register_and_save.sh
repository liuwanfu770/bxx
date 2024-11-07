#!/bin/bash

# 检查是否传入了电话号码和验证码
if [ $# -lt 1 ]; then
  echo "用法: $0 <电话号码>"
  exit 1
fi

PHONE_NUMBER="$1"             # 第一个参数作为电话号码
BASE_DIR="/Users/bc/signal-cli-backend/accounts"  # 保存账号信息的根目录

# 查找下一个可用的 accountX 文件夹编号
NEXT_ACCOUNT_DIR=""
for ((i=1; ; i++)); do
  ACCOUNT_DIR="$BASE_DIR/account$i"
  if [ ! -d "$ACCOUNT_DIR" ]; then
    NEXT_ACCOUNT_DIR="$ACCOUNT_DIR"
    break
  fi
done

# 创建新的 accountX 文件夹
mkdir -p "$NEXT_ACCOUNT_DIR"

# 创建 account_info.json 文件并写入号码信息
echo "保存号码信息到 $NEXT_ACCOUNT_DIR/account_info.json"
cat <<EOF > "$NEXT_ACCOUNT_DIR/account_info.json"
{
  "registered_number": "$PHONE_NUMBER",
  "config_path": "$NEXT_ACCOUNT_DIR",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOF

echo "号码 $PHONE_NUMBER 已成功注册并存入 $NEXT_ACCOUNT_DIR/account_info.json"