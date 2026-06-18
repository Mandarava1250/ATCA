# 华夏营造 (ATCA) - 文档目录

## 📋 文档结构

本目录包含华夏营造项目的所有技术文档，按主题分类组织：

### 📁 architecture - 架构文档

- [animation-system.md](architecture/animation-system.md) - 页面转场动画系统说明
- [api-documentation.md](architecture/api-documentation.md) - 后端API接口规范

### 📁 deployment - 部署文档

- [nginx-deployment.md](deployment/nginx-deployment.md) - Nginx反向代理部署指南

### 📁 performance - 性能文档

- [client-state-storage-guide.md](performance/client-state-storage-guide.md) - 客户端状态存储配置指南
- [implementation-summary.md](performance/implementation-summary.md) - 功能实现与性能优化总结
- [p99-diagnosis-guide.md](performance/p99-diagnosis-guide.md) - P99响应时间排查指南
- [performance-testing-guide.md](performance/performance-testing-guide.md) - 高并发性能测试指南

### 📁 security - 安全文档

- [security-policy.md](security/security-policy.md) - 安全策略文档

## 📝 文档规范

### 文件命名

所有文档文件使用 `kebab-case` 命名规范（小写字母 + 连字符），例如：
- `animation-system.md`
- `api-documentation.md`

### 文件格式

- 文件编码：UTF-8
- 换行符：LF（Unix风格）
- 文件格式：Markdown

### 文档内容

每个文档应包含：
1. 标题和概述
2. 详细说明
3. 使用示例
4. 相关链接

## 🔗 快速导航

### 新手入门

1. 阅读 [API文档](architecture/api-documentation.md) 了解接口规范
2. 阅读 [部署指南](deployment/nginx-deployment.md) 了解部署流程

### 性能优化

1. 阅读 [性能测试指南](performance/performance-testing-guide.md) 进行性能测试
2. 阅读 [P99诊断指南](performance/p99-diagnosis-guide.md) 解决性能问题
3. 阅读 [实现总结](performance/implementation-summary.md) 了解优化措施

### 安全配置

1. 阅读 [安全策略](security/security-policy.md) 了解安全措施
2. 按照文档配置安全防护

## 📚 相关资源

- [项目README](../README.md) - 项目概述和快速开始
- [API文档在线版](https://atca.xin/api-docs) - Swagger在线文档

---

**文档维护**: ATCA Development Team  
**最后更新**: 2026-06-19