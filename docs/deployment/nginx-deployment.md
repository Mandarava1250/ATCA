# Nginx 反向代理部署指南

## 📋 概述

本配置针对 **2核 2G 服务器** 进行了全面优化，包括：
- 高效的并发连接处理
- 智能缓存策略
- Gzip 压缩
- 限流保护
- 静态资源优化

---

## 🚀 快速部署

### 1. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx -y

# CentOS/RHEL
sudo yum install nginx -y
```

### 2. 备份原配置

```bash
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
```

### 3. 部署配置文件

```bash
# 复制配置文件
sudo cp nginx.conf /etc/nginx/nginx.conf

# 创建缓存目录
sudo mkdir -p /var/cache/nginx
sudo chown -R nginx:nginx /var/cache/nginx
```

### 4. 配置域名

编辑配置文件，替换 `atca.xin` 为你的实际域名：

```bash
sudo nano /etc/nginx/nginx.conf
```

### 5. 部署前端静态文件

```bash
# 创建前端目录
sudo mkdir -p /var/www/atca/frontend

# 复制构建后的前端文件
sudo cp -r frontend/dist/* /var/www/atca/frontend/

# 设置权限
sudo chown -R nginx:nginx /var/www/atca
sudo chmod -R 755 /var/www/atca
```

### 6. 测试配置

```bash
sudo nginx -t
```

### 7. 启动 Nginx

```bash
# 启动服务
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 查看状态
sudo systemctl status nginx
```

---

## 🔧 配置优化说明

### 1. Worker 进程配置

```nginx
worker_processes auto;  # 自动检测CPU核心数
worker_connections 2048;  # 每个进程2048个连接
```

**效果**：2核服务器使用2个worker进程，总计支持4096个并发连接。

### 2. Gzip 压缩

```nginx
gzip on;
gzip_comp_level 6;  # 平衡压缩率和CPU消耗
gzip_types text/plain text/css application/json ...;
```

**效果**：减少60-80%的传输数据量，显著提升加载速度。

### 3. 静态资源缓存

```nginx
# 带哈希的静态资源（长期缓存）
location ~* \.(js|css|png|jpg|...)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# HTML文件（不缓存）
location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

**效果**：
- 静态资源缓存1年，减少重复请求
- HTML文件实时更新，确保获取最新版本

### 4. API 代理缓存

```nginx
proxy_cache static_cache;
proxy_cache_valid 200 302 10m;
```

**效果**：API响应缓存10分钟，减少后端数据库压力。

### 5. 连接复用

```nginx
upstream backend {
    keepalive 32;  # 保持32个空闲连接
    keepalive_timeout 60s;
}
```

**效果**：减少TCP握手开销，提升API响应速度。

### 6. 限流保护

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
```

**效果**：每个IP每秒最多10个请求，防止服务器过载。

---

## 📊 性能监控

### 查看 Nginx 状态

```bash
# 查看进程状态
ps aux | grep nginx

# 查看连接数
netstat -an | grep :80 | wc -l

# 查看实时日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 查看缓存命中率

```bash
# 统计缓存状态
grep "X-Cache-Status" /var/log/nginx/access.log | \
    awk '{print $NF}' | sort | uniq -c
```

### 监控系统资源

```bash
# CPU和内存使用
top

# 磁盘IO
iostat -x 1

# 网络连接
ss -s
```

---

## 🔒 HTTPS 配置（推荐）

### 1. 安装 Certbot

```bash
# Ubuntu/Debian
sudo apt install certbot python3-certbot-nginx -y

# CentOS/RHEL
sudo yum install certbot python3-certbot-nginx -y
```

### 2. 获取 SSL 证书

```bash
sudo certbot --nginx -d atca.xin
```

### 3. 启用 HTTPS 配置

在 `nginx.conf` 中取消注释 HTTPS 相关配置块。

### 4. 自动续期

```bash
# 测试续期
sudo certbot renew --dry-run

# Certbot会自动配置续期任务
```

---

## 🐛 常见问题

### 1. 502 Bad Gateway

**原因**：后端服务未启动或端口错误

**解决**：
```bash
# 检查后端服务状态
sudo systemctl status atca-backend

# 检查端口是否监听
netstat -tlnp | grep 5000
```

### 2. 504 Gateway Timeout

**原因**：后端响应超时

**解决**：增加 `proxy_read_timeout` 值
```nginx
proxy_read_timeout 60s;
```

### 3. 静态资源 404

**原因**：前端文件未部署或路径错误

**解决**：
```bash
# 检查文件是否存在
ls -la /var/www/atca/frontend/

# 重新部署前端文件
npm run build
sudo cp -r frontend/dist/* /var/www/atca/frontend/
```

### 4. 内存不足

**原因**：缓存设置过大

**解决**：调整缓存大小
```nginx
proxy_cache_path ... max_size=50m ...;  # 减小缓存大小
```

---

## 📈 性能调优建议

### 1. 根据实际负载调整

```nginx
# 高流量场景
worker_connections 4096;
keepalive 64;

# 低流量场景（节省内存）
worker_connections 1024;
keepalive 16;
```

### 2. 启用 HTTP/2

```nginx
listen 443 ssl http2;
```

### 3. 使用 CDN

对于静态资源，建议使用 CDN 服务：
- 图片：阿里云 OSS + CDN
- JS/CSS：jsDelivr、unpkg
- 字体：Google Fonts CDN

### 4. 数据库优化

确保后端数据库已配置查询缓存和连接池优化。

---

## 🔍 配置验证

### 测试配置语法

```bash
sudo nginx -t
```

### 重新加载配置

```bash
sudo nginx -s reload
```

### 完整重启

```bash
sudo systemctl restart nginx
```

---

## 📞 技术支持

如遇问题，请检查：
1. Nginx 错误日志：`/var/log/nginx/error.log`
2. Nginx 访问日志：`/var/log/nginx/access.log`
3. 系统日志：`journalctl -u nginx`

---

## 📚 参考资源

- [Nginx 官方文档](http://nginx.org/en/docs/)
- [Nginx 性能优化指南](https://www.nginx.com/blog/tuning-nginx/)
- [HTTP 缓存最佳实践](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching)

---

## ✅ 部署检查清单

- [ ] Nginx 已安装并启动
- [ ] 配置文件已部署
- [ ] 域名已配置
- [ ] 前端静态文件已部署
- [ ] 后端服务正常运行
- [ ] 防火墙已开放80/443端口
- [ ] SSL证书已配置（生产环境）
- [ ] 监控和日志已配置
- [ ] 性能测试已完成

---

**配置文件位置**：`d:\Code\ATCA\nginx.conf`