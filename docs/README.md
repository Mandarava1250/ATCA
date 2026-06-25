# 华夏营造 (ATCA) - 技术文档目录

## 📋 文档结构

本目录包含华夏营造项目的所有技术文档，按主题分类组织：

### 📁 architecture - 架构文档

- [animation-system.md](architecture/animation-system.md) - 页面转场动画系统说明
- [api-documentation.md](architecture/api-documentation.md) - 后端API接口规范（完整接口列表）

### 📁 deployment - 部署文档

- [nginx-deployment.md](deployment/nginx-deployment.md) - Nginx反向代理部署指南

### 📁 performance - 性能文档

- [client-state-storage-guide.md](performance/client-state-storage-guide.md) - 客户端状态存储配置指南
- [implementation-summary.md](performance/implementation-summary.md) - 功能实现与性能优化总结
- [p99-diagnosis-guide.md](performance/p99-diagnosis-guide.md) - P99响应时间排查指南
- [performance-testing-guide.md](performance/performance-testing-guide.md) - 高并发性能测试指南

### 📁 security - 安全文档

- [security-policy.md](security/security-policy.md) - 安全策略文档

---

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
5. 版本信息

---

## 🔗 快速导航

### 新手入门

1. **项目概述**：阅读 [项目README](../README.md) 了解项目整体情况
2. **API文档**：阅读 [API文档](architecture/api-documentation.md) 了解接口规范
3. **快速开始**：按照README中的快速开始指南搭建开发环境

### 开发指南

1. **项目结构**：参考README中的项目结构说明
2. **代码规范**：遵循README中的开发规范
3. **测试指南**：参考README中的测试命令

### 性能优化

1. **性能测试**：阅读 [性能测试指南](performance/performance-testing-guide.md) 进行性能测试
2. **P99诊断**：阅读 [P99诊断指南](performance/p99-diagnosis-guide.md) 解决性能问题
3. **实现总结**：阅读 [实现总结](performance/implementation-summary.md) 了解优化措施
4. **状态存储**：阅读 [客户端状态存储指南](performance/client-state-storage-guide.md) 配置状态管理

### 安全配置

1. **安全策略**：阅读 [安全策略](security/security-policy.md) 了解安全措施
2. **配置指南**：按照文档配置安全防护
3. **最佳实践**：参考安全策略中的开发安全规范

### 部署上线

1. **Nginx配置**：阅读 [Nginx部署指南](deployment/nginx-deployment.md) 配置反向代理
2. **环境变量**：参考README中的环境变量配置说明
3. **Docker部署**：参考README中的Docker部署指南

---

## 📊 文档版本管理

| 文档 | 版本 | 最后更新 |
|------|------|----------|
| README.md | 1.0.0 | 2026-06-22 |
| architecture/api-documentation.md | 1.0.0 | 2026-06-22 |
| architecture/animation-system.md | 1.0.0 | 2026-06-19 |
| deployment/nginx-deployment.md | 1.0.0 | 2026-06-19 |
| performance/implementation-summary.md | 1.0.0 | 2026-06-19 |
| performance/p99-diagnosis-guide.md | 1.0.0 | 2026-06-19 |
| performance/performance-testing-guide.md | 1.0.0 | 2026-06-19 |
| performance/client-state-storage-guide.md | 1.0.0 | 2026-06-19 |
| security/security-policy.md | 1.0.0 | 2026-06-19 |

---

## 🚀 快速开始文档阅读路径

```
新手开发者推荐阅读顺序：

1. README.md (项目概述)
    ↓
2. architecture/api-documentation.md (API接口)
    ↓
3. performance/implementation-summary.md (性能优化)
    ↓
4. security/security-policy.md (安全策略)
    ↓
5. deployment/nginx-deployment.md (部署指南)
```

---

## 📚 相关资源

- [项目README](../README.md) - 项目概述和快速开始
- [API文档在线版](https://atca.xin/api-docs) - Swagger在线文档
- [GitHub仓库](https://github.com/yourusername/ATCA) - 项目源代码
- [在线演示](https://demo.atca.xin) - 项目演示站点

---

## 📞 文档反馈

如果您发现文档中有错误或需要改进的地方，请：
1. 检查 [GitHub Issues](https://github.com/yourusername/ATCA/issues)
2. 创建新的Issue，描述问题或建议
3. 提交Pull Request修复问题

---

**文档维护**: ATCA Development Team  
**最后更新**: 2026-06-22  
**文档版本**: 2.0.1