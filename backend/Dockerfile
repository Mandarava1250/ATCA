# 后端 Dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装构建工具（mssql 原生模块需要）
RUN apk add --no-cache python3 make g++ libc6-compat

# 安装依赖
COPY package*.json ./
RUN npm install

# 复制源码
COPY . .

# 构建
RUN npm run build

# 暴露端口
EXPOSE 3000

# 创建上传目录
RUN mkdir -p uploads

# 启动
CMD ["node", "dist/main.js"]
