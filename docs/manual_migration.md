# 手动执行数据迁移指南 (Debug & Fix)

如果自动部署后的文章为空，请按照以下步骤在服务器上执行手动迁移。

## 1. 获取 PAYLOAD_SECRET
运行以下命令查看当前正在运行的容器使用的 Secret：
```bash
docker inspect shenleng-container | grep PAYLOAD_SECRET
```
复制输出中 `PAYLOAD_SECRET=` 之后的那串字符。

## 2. 执行迁移命令
请在服务器终端中**复制并粘贴**以下代码块（记得替换 `你的_SECRET_在这里`）：

```bash
# 进入项目目录
cd ~/Projects/shenleng

# 1. 彻底清除旧数据库文件（确保干净启动）
rm -rf persistence/sqlite/payload.db

# 2. 运行迁移容器
docker run --rm \
  -v $(pwd)/persistence/sqlite:/app/database \
  -v $(pwd)/persistence/media:/app/public/media \
  -v ~/shenleng_data_source:/app/migration_source \
  -e PAYLOAD_SECRET="你的_SECRET_在这里" \
  -e DATABASE_URI="file:/app/database/payload.db" \
  -e PAYLOAD_CONFIG_PATH="src/payload.config.ts" \
  -e MIGRATION_SOURCE_DIR="/app/migration_source" \
  shenleng-site \
  npm run migrate:content

# 3. 运行完成后，重启主应用容器以加载新数据库
docker restart shenleng-container
```

## 3. 常见报错排查
*   **Articles directory not found**: 检查 `~/shenleng_data_source` 下是否有 `content/articles` 文件夹。
*   **Permission Denied**: 如果报错 14 或无法创建文件，说明 `persistence` 目录权限不对。请先执行 `chmod -R 777 persistence`。
*   **Images not found**: 检查 `~/shenleng_data_source/public/images` 是否存在。

运行成功后，访问 `https://www.finverse.top/articles` 即可看到文章。
