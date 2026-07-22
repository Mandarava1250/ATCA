# 筑见山河 - Nginx反向代理部署指南

## 概述

本文档介绍如何使用 Nginx 作为反向代理部署筑见山河项目，包括配置 HTTPS、负载均衡、静态资源优化等。

---

## 环境要求

| 软件 | 版本 | 说明 |
|------|------|------|
| Nginx | 1.20+ | 反向代理服务器 |
| OpenSSL | 1.1.1+ | SSL证书生成 |
| Node.js | 18+ | 前端构建 |
| Redis | 6+ | 缓存服务 |

---

## 基础配置

### 1. 前端构建

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 构建生产版本
npm run build
```

### 2. Nginx 配置文件

```nginx
# /etc/nginx/sites-available/atca.conf

server {
    listen 80;
    server_name atca.xin www.atca.xin;
    
    # 重定向到HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name atca.xin www.atca.xin;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/atca.xin/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atca.xin/privkey.pem;
    
    # SSL优化
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头部
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # 前端静态资源
    location / {
        root /var/www/atca/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # API反向代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket支持
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 超时配置
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
    
    # 静态文件优化
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        root /var/www/atca/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Access-Control-Allow-Origin *;
    }
    
    # 日志配置
    access_log /var/log/nginx/atca.access.log;
    error_log /var/log/nginx/atca.error.log;
}
```

---

## 负载均衡配置

### 多服务器负载均衡

```nginx
# /etc/nginx/conf.d/upstream.conf

upstream atca_backend {
    # 最少连接数策略
    least_conn;
    
    # 后端服务器列表
    server 192.168.1.101:3000 weight=1;
    server 192.168.1.102:3000 weight=1;
    server 192.168.1.103:3000 weight=2;
    
    # 健康检查
    server 192.168.1.104:3000 backup;
}

server {
    listen 443 ssl http2;
    server_name api.atca.xin;
    
    ssl_certificate /etc/letsencrypt/live/api.atca.xin/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.atca.xin/privkey.pem;
    
    location / {
        proxy_pass http://atca_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 健康检查
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
    }
}
```

---

## HTTPS配置

### 生成Let's Encrypt证书

```bash
# 安装certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 生成证书
sudo certbot --nginx -d atca.xin -d www.atca.xin

# 自动续期测试
sudo certbot renew --dry-run
```

### 证书自动续期

```bash
# 添加cron任务
echo "0 3 * * * /usr/bin/certbot renew --quiet" | sudo tee -a /etc/crontab
```

---

## 性能优化

### Gzip压缩

```nginx
# /etc/nginx/nginx.conf

http {
    # Gzip配置
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
}
```

### 静态资源缓存

```nginx
# 不同类型文件的缓存策略
location ~* \.(html|htm)$ {
    expires 1h;
    add_header Cache-Control "public, must-revalidate";
}

location ~* \.(js|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~* \.(png|jpg|jpeg|gif|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header ETag "";
}
```

### 图片优化

```nginx
# WebP支持
location ~* \.(jpg|jpeg|png)$ {
    add_header Vary Accept;
    try_files $uri.webp $uri;
}
```

---

## 安全配置

### 限制请求速率

```nginx
# 限制API请求速率
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

server {
    # ... 其他配置
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://localhost:3000;
    }
}
```

### 禁止访问敏感文件

```nginx
# 禁止访问隐藏文件
location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
}

# 禁止访问配置文件
location ~* \.(env|json|md)$ {
    deny all;
}
```

### CORS配置

```nginx
# CORS配置
location /api/ {
    if ($request_method = 'OPTIONS') {
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        return 204;
    }
    
    proxy_pass http://localhost:3000;
}
```

---

## 日志配置

### 访问日志格式

```nginx
# /etc/nginx/nginx.conf

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    '$request_time $upstream_response_time';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
}
```

### 日志轮转

```bash
# /etc/logrotate.d/nginx

/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 `cat /var/run/nginx.pid`
    endscript
}
```

---

## 部署脚本

### 自动化部署脚本

```bash
#!/bin/bash

# deploy.sh
set -e

echo "=== 部署筑见山河 ==="

# 1. 拉取最新代码
echo "1. 拉取最新代码..."
cd /var/www/atca
git pull origin main

# 2. 构建前端
echo "2. 构建前端..."
cd frontend
npm install
npm run build

# 3. 重启后端服务
echo "3. 重启后端服务..."
pm2 restart atca-backend

# 4. 重启Nginx
echo "4. 重启Nginx..."
systemctl reload nginx

echo "=== 部署完成 ==="
```

### 部署步骤

```bash
# 赋予执行权限
chmod +x deploy.sh

# 执行部署
./deploy.sh
```

---

## Docker部署配置

### Docker Compose配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  nginx:
    image: nginx:1.25-alpine
    container_name: atca-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/certs:/etc/letsencrypt
      - ./frontend/dist:/var/www/atca/dist
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - atca-network

  backend:
    build: ./backend
    container_name: atca-backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=sqlserver://db:1433;database=atca;user=sa;password=YourStrongPassword
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret-key
    ports:
      - "3000:3000"
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - atca-network

  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: atca-db
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=YourStrongPassword
      - MSSQL_PID=Express
    ports:
      - "1433:1433"
    volumes:
      - mssql_data:/var/opt/mssql
    restart: unless-stopped
    networks:
      - atca-network

  redis:
    image: redis:7-alpine
    container_name: atca-redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - atca-network

volumes:
  mssql_data:
  redis_data:

networks:
  atca-network:
    driver: bridge
```

### Docker Nginx配置

```nginx
# nginx/conf/default.conf

server {
    listen 80;
    server_name atca.xin www.atca.xin;
    
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name atca.xin www.atca.xin;
    
    # SSL配置
    ssl_certificate /etc/letsencrypt/live/atca.xin/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/atca.xin/privkey.pem;
    
    # 安全头部
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # 前端静态资源
    location / {
        root /var/www/atca/dist;
        try_files $uri $uri/ /index.html;
        expires 1d;
        add_header Cache-Control "public, immutable";
    }
    
    # API反向代理
    location /api/ {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
    
    # 静态文件优化
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        root /var/www/atca/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 环境变量配置

### 后端环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | production |
| `PORT` | 服务端口 | 3000 |
| `DATABASE_URL` | 数据库连接字符串 | - |
| `REDIS_URL` | Redis连接地址 | redis://localhost:6379 |
| `JWT_SECRET` | JWT密钥 | - |
| `JWT_EXPIRES_IN` | JWT过期时间 | 15m |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh Token过期时间 | 7d |
| `LOG_LEVEL` | 日志级别 | info |
| `CORS_ORIGIN` | 允许的CORS来源 | * |
| `MAX_FILE_SIZE` | 最大文件上传大小 | 10MB |

### 环境变量文件示例

```env
# .env.production
NODE_ENV=production
PORT=3000
DATABASE_URL=sqlserver://localhost:1433;database=atca;user=sa;password=YourStrongPassword
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-256-bit-secret-key-here
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
LOG_LEVEL=info
CORS_ORIGIN=https://atca.xin
MAX_FILE_SIZE=10MB
```

---

## 高级安全配置

### 配置安全头部

```nginx
# 安全头部配置
server {
    # ... 其他配置
    
    # 内容安全策略
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://api.atca.xin;";
    
    # 权限策略
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()";
    
    # 跨域资源策略
    add_header Cross-Origin-Resource-Policy "same-origin";
    
    # 跨域嵌入策略
    add_header Cross-Origin-Embedder-Policy "require-corp";
    
    # 跨域opener策略
    add_header Cross-Origin-Opener-Policy "same-origin";
}
```

### 限制请求大小

```nginx
# 限制请求体大小
server {
    # ... 其他配置
    
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    
    location /api/upload {
        client_max_body_size 50M;
        proxy_pass http://localhost:3000;
    }
}
```

---

## 监控与日志

### 接入Prometheus监控

```nginx
# 启用stub_status模块
server {
    listen 127.0.0.1:8080;
    
    location /nginx_status {
        stub_status on;
        access_log off;
        allow 127.0.0.1;
        deny all;
    }
}
```

### 日志分析配置

```bash
# 安装GoAccess
sudo apt-get install goaccess

# 实时日志分析
goaccess /var/log/nginx/atca.access.log -o /var/www/atca/logs/report.html --log-format=COMBINED --real-time-html
```

---

## 常见问题

### 1. SSL证书问题

**问题**: 证书过期或无法获取

**解决方案**:
```bash
# 重新获取证书
sudo certbot renew --force-renewal

# 检查证书状态
sudo certbot certificates
```

### 2. 静态资源404

**问题**: 前端资源无法加载

**解决方案**:
```bash
# 检查文件权限
sudo chown -R www-data:www-data /var/www/atca/dist

# 检查Nginx配置
nginx -t
systemctl reload nginx
```

### 3. 反向代理超时

**问题**: API请求超时

**解决方案**:
```nginx
# 增加超时时间
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

### 4. Docker网络问题

**问题**: 容器之间无法通信

**解决方案**:
```bash
# 检查网络配置
docker network inspect atca-network

# 重启相关容器
docker-compose restart backend nginx
```

### 5. 数据库连接失败

**问题**: 后端无法连接数据库

**解决方案**:
```bash
# 检查数据库容器状态
docker-compose logs db

# 验证数据库连接
sqlcmd -S localhost,1433 -U sa -P YourStrongPassword -Q "SELECT @@VERSION"
```
