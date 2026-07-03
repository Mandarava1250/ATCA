# 华夏营造开源代码与组件使用情况说明

**项目名称**: 华夏营造 (ATCA - Ancient Traditional Chinese Architecture)  
**版本**: v1.0.0  
**编写日期**: 2026-06-30  
**文档目的**: 详细列出项目中使用的所有开源代码、库、框架、组件及其使用情况

---

## 目录

1. [项目许可协议](#1-项目许可协议)
2. [前端开源依赖](#2-前端开源依赖)
3. [后端开源依赖](#3-后端开源依赖)
4. [第三方开源资源](#4-第三方开源资源)
5. [开发工具依赖](#5-开发工具依赖)
6. [许可协议兼容性说明](#6-许可协议兼容性说明)
7. [致谢声明](#7-致谢声明)

---

## 1. 项目许可协议

华夏营造项目采用 **MIT License** 许可协议。

```
MIT License

Copyright (c) 2026 华夏营造开发团队

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 2. 前端开源依赖

### 2.1 生产环境依赖 (Production Dependencies)

| 库名称 | 版本 | 许可协议 | 用途说明 | 官网/仓库 |
|--------|------|---------|---------|-----------|
| **Vue.js** | ^3.5.0 | MIT License | 渐进式JavaScript框架，项目核心框架，使用Composition API构建响应式UI界面 | [vuejs.org](https://vuejs.org/) |
| **TypeScript** | ^5.7.0 | Apache-2.0 License | TypeScript语言支持，提供类型安全、接口定义、编译时错误检查 | [typescriptlang.org](https://www.typescriptlang.org/) |
| **Vue Router** | ^4.5.0 | MIT License | Vue官方路由管理器，实现SPA路由跳转、路由守卫、懒加载 | [router.vuejs.org](https://router.vuejs.org/) |
| **Pinia** | ^2.3.0 | MIT License | Vue新一代状态管理库，管理用户状态、AI并发状态、动画设置等全局状态 | [pinia.vuejs.org](https://pinia.vuejs.org/) |
| **Three.js** | ^0.170.0 | MIT License | WebGL 3D渲染引擎，实现古建筑3D建模、构件渲染、场景管理、交互控制 | [threejs.org](https://threejs.org/) |
| **axios** | ^1.8.0 | MIT License | HTTP客户端，用于前端与后端RESTful API通信，支持拦截器、请求重试 | [axios-http.com](https://axios-http.com/) |
| **Socket.io-client** | ^4.8.3 | MIT License | WebSocket客户端，实现实时通信、消息推送、在线状态同步 | [socket.io](https://socket.io/) |
| **vue-i18n** | ^9.14.5 | MIT License | Vue国际化插件，支持中英双语切换、翻译文件管理、动态语言加载 | [kazupon.github.io/vue-i18n](https://kazupon.github.io/vue-i18n/) |
| **@babel/parser** | ^8.0.0 | MIT License | Babel解析器，用于JavaScript代码解析、AST生成 | [babeljs.io](https://babeljs.io/) |
| **@rollup/rollup-win32-x64-msvc** | ^4.62.2 | MIT License | Rollup Windows平台原生二进制文件，优化构建性能 | [rollupjs.org](https://rollupjs.org/) |

### 2.2 开发环境依赖 (Development Dependencies)

| 库名称 | 版本 | 许可协议 | 用途说明 | 官网/仓库 |
|--------|------|---------|---------|-----------|
| **Vite** | ^8.1.0 | MIT License | 下一代前端构建工具，提供极速冷启动、HMR、ESM原生支持 | [vitejs.dev](https://vitejs.dev/) |
| **@vitejs/plugin-vue** | ^6.0.7 | MIT License | Vite Vue插件，支持Vue单文件组件编译、HMR集成 | [github.com/vitejs/vite-plugin-vue](https://github.com/vitejs/vite-plugin-vue) |
| **vue-tsc** | ^2.2.0 | MIT License | Vue TypeScript类型检查工具，编译前类型验证 | [github.com/vuejs/language-tools](https://github.com/vuejs/language-tools) |
| **@types/node** | ^22.0.0 | MIT License | Node.js类型定义，提供Node API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/three** | ^0.170.0 | MIT License | Three.js类型定义，提供Three.js API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@vue/test-utils** | ^2.4.6 | MIT License | Vue官方测试工具库，用于组件单元测试、模拟用户交互 | [test-utils.vuejs.org](https://test-utils.vuejs.org/) |
| **vitest** | ^4.1.9 | MIT License | Vite原生测试框架，提供快速单元测试、覆盖率报告 | [vitest.dev](https://vitest.dev/) |
| **jsdom** | ^26.0.0 | MIT License | JavaScript DOM实现，用于浏览器环境模拟测试 | [github.com/jsdom/jsdom](https://github.com/jsdom/jsdom) |
| **cssnano** | ^8.0.2 | MIT License | CSS压缩优化工具，优化生产环境CSS体积 | [cssnano.co](https://cssnano.co/) |
| **esbuild** | ^0.25.0 | MIT License | 极速JavaScript打包器，用于依赖预构建、代码压缩 | [esbuild.github.io](https://esbuild.github.io/) |
| **rollup-plugin-visualizer** | ^7.0.1 | MIT License | Rollup可视化插件，生成构建产物依赖分析报告 | [github.com/btd/rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer) |
| **vite-plugin-html** | ^3.2.2 | MIT License | Vite HTML模板插件，支持HTML模板变量注入、多页面应用 | [github.com/anncwb/vite-plugin-html](https://github.com/anncwb/vite-plugin-html) |

---

## 3. 后端开源依赖

### 3.1 生产环境依赖 (Production Dependencies)

| 库名称 | 版本 | 许可协议 | 用途说明 | 官网/仓库 |
|--------|------|---------|---------|-----------|
| **Node.js** | >=18.0.0 | MIT License | JavaScript运行时环境，后端服务运行平台 | [nodejs.org](https://nodejs.org/) |
| **Express** | ^4.19.2 | MIT License | Web应用框架，实现RESTful API、中间件链、路由管理 | [expressjs.com](https://expressjs.com/) |
| **TypeScript** | ^5.4.5 | Apache-2.0 License | TypeScript编译器，后端代码类型检查与编译 | [typescriptlang.org](https://www.typescriptlang.org/) |
| **mssql** | ^11.0.0 | MIT License | SQL Server数据库驱动，实现数据库连接池、查询执行、事务管理 | [github.com/tediousjs/node-mssql](https://github.com/tediousjs/node-mssql) |
| **jsonwebtoken** | ^9.0.2 | MIT License | JWT认证库，实现用户身份认证、Token生成与验证、黑名单管理 | [github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) |
| **bcryptjs** | ^2.4.3 | MIT License | 密码加密库，实现用户密码哈希、加盐处理、密码验证 | [github.com/dcodeIO/bcrypt.js](https://github.com/dcodeIO/bcrypt.js) |
| **bcrypt** | ^6.0.0 | MIT License | 原生bcrypt库，高性能密码加密实现 | [github.com/kelektiv/node.bcrypt.js](https://github.com/kelektiv/node.bcrypt.js) |
| **Zod** | ^3.23.8 | MIT License | TypeScript优先的模式验证库，实现请求参数验证、数据结构校验 | [zod.dev](https://zod.dev/) |
| **Socket.io** | ^4.8.3 | MIT License | WebSocket库，实现实时通信、消息推送、房间管理 | [socket.io](https://socket.io/) |
| **ioredis** | ^5.11.1 | MIT License | Redis客户端，实现分布式缓存、Token黑名单存储、Session共享 | [github.com/luin/ioredis](https://github.com/luin/ioredis) |
| **axios** | ^1.7.2 | MIT License | HTTP客户端，用于调用外部AI模型API（千问、DeepSeek、讯飞） | [axios-http.com](https://axios-http.com/) |
| **Multer** | ^1.4.5-lts.1 | MIT License | 文件上传中间件，实现头像上传、图片处理、文件存储 | [github.com/expressjs/multer](https://github.com/expressjs/multer) |
| **helmet** | ^7.1.0 | MIT License | 安全中间件，设置HTTP安全头部、CSP策略、XSS防护 | [helmetjs.github.io](https://helmetjs.github.io/) |
| **cors** | ^2.8.5 | MIT License | CORS中间件，实现跨域资源共享、白名单管理 | [github.com/expressjs/cors](https://github.com/expressjs/cors) |
| **compression** | ^1.8.1 | MIT License | 响应压缩中间件，实现Gzip压缩、响应体积优化 | [github.com/expressjs/compression](https://github.com/expressjs/compression) |
| **morgan** | ^1.10.0 | MIT License | HTTP请求日志中间件，记录请求日志、性能监控 | [github.com/expressjs/morgan](https://github.com/expressjs/morgan) |
| **express-rate-limit** | ^7.2.0 | MIT License | 限流中间件，实现暴力破解防护、API限流、请求频率控制 | [github.com/nfriedly/express-rate-limit](https://github.com/nfriedly/express-rate-limit) |
| **dotenv** | ^16.4.5 | MIT License | 环境变量加载库，从.env文件加载配置、敏感信息管理 | [github.com/motdotla/dotenv](https://github.com/motdotla/dotenv) |
| **etag** | ^1.8.1 | MIT License | ETag生成库，实现响应缓存验证、条件请求处理 | [github.com/jshttp/etag](https://github.com/jshttp/etag) |
| **uuid** | ^9.0.1 | MIT License | UUID生成库，生成唯一标识符、文件命名、ID生成 | [github.com/uuidjs/uuid](https://github.com/uuidjs/uuid) |
| **reflect-metadata** | ^0.2.2 | Apache-2.0 License | 元数据反射API，用于装饰器元数据、控制器路由反射 | [github.com/rbuckton/reflect-metadata](https://github.com/rbuckton/reflect-metadata) |

### 3.2 开发环境依赖 (Development Dependencies)

| 库名称 | 版本 | 许可协议 | 用途说明 | 实网/仓库 |
|--------|------|---------|---------|-----------|
| **tsx** | ^4.11.0 | MIT License | TypeScript执行器，支持直接运行TS文件、热重载开发 | [github.com/esbuild-kit/tsx](https://github.com/esbuild-kit/tsx) |
| **jest** | ^30.4.2 | MIT License | JavaScript测试框架，实现单元测试、集成测试、覆盖率报告 | [jestjs.io](https://jestjs.io/) |
| **ts-jest** | ^29.4.11 | MIT License | Jest TypeScript预处理器，支持TS文件测试、类型检查集成 | [kulshekhar.github.io/ts-jest](https://kulshekhar.github.io/ts-jest/) |
| **supertest** | ^7.2.2 | MIT License | HTTP测试库，实现API端点测试、响应验证、集成测试 | [github.com/visionmedia/supertest](https://github.com/visionmedia/supertest) |
| **swagger-jsdoc** | ^6.3.0 | MIT License | Swagger文档生成器，从JSDoc注释生成API文档 | [github.com/Surnet/swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc) |
| **swagger-ui-express** | ^5.0.1 | MIT License | Swagger UI中间件，提供可视化API文档界面 | [github.com/scottie1984/swagger-ui-express](https://github.com/scottie1984/swagger-ui-express) |
| **@types/express** | ^4.17.21 | MIT License | Express类型定义，提供Express API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/node** | ^20.19.43 | MIT License | Node.js类型定义，提供Node API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/mssql** | ^9.1.5 | MIT License | mssql类型定义，提供数据库API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/jsonwebtoken** | ^9.0.6 | MIT License | JWT类型定义，提供JWT API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/bcryptjs** | ^2.4.6 | MIT License | bcryptjs类型定义，提供加密API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/ioredis** | ^5.0.0 | MIT License | ioredis类型定义，提供Redis API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/cors** | ^2.8.17 | MIT License | cors类型定义，提供CORS中间件的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/compression** | ^1.8.1 | MIT License | compression类型定义，提供压缩中间件的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/multer** | ^1.4.11 | MIT License | multer类型定义，提供文件上传中间件的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/morgan** | ^1.9.9 | MIT License | morgan类型定义，提供日志中间件的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/uuid** | ^9.0.8 | MIT License | uuid类型定义，提供UUID生成API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/etag** | ^1.8.4 | MIT License | etag类型定义，提供ETag生成API的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/swagger-jsdoc** | ^6.0.4 | MIT License | swagger-jsdoc类型定义，提供Swagger文档生成的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/swagger-ui-express** | ^4.1.8 | MIT License | swagger-ui-express类型定义，提供Swagger UI的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/supertest** | ^7.2.0 | MIT License | supertest类型定义，提供HTTP测试库的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |
| **@types/jest** | ^30.0.0 | MIT License | Jest类型定义，提供测试框架的TypeScript类型支持 | [github.com/DefinitelyTyped/DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) |

---

## 4. 第三方开源资源

### 4.1 ECharts可视化库

| 资源名称 | 版本/来源 | 许可协议 | 用途说明 | 官网/仓库 |
|---------|----------|---------|---------|-----------|
| **ECharts** | 5.x (压缩版) | Apache-2.0 License | 数据可视化图表库，用于答题分析页面显示能力雷达图、正确率趋势、排行榜展示 | [echarts.apache.org](https://echarts.apache.org/) |

**使用位置**: `frontend/public/echarts.min.js`  
**集成方式**: 直接引入压缩版JS文件，避免npm依赖体积过大  
**许可协议**: Apache-2.0，允许商业使用、修改、分发

### 4.2 中国地图数据

| 资源名称 | 来源 | 许可协议 | 用途说明 | 数据说明 |
|---------|------|---------|---------|-----------|
| **china.json** | Apache ECharts官方示例 | Apache-2.0 License | 中国省份地图GeoJSON数据，用于省份古建筑分布地图展示 | 包含34个省级行政区边界坐标数据 |

**使用位置**: `frontend/public/map-data/china.json`  
**数据来源**: ECharts官方地图数据示例  
**许可协议**: Apache-2.0，允许免费使用、修改  
**数据完整性**: 包含台湾省、香港特别行政区、澳门特别行政区等全部34个省级行政区

**使用说明**:
```javascript
// 地图数据加载示例
import chinaMapData from '@/public/map-data/china.json';

// 注册地图数据到ECharts
echarts.registerMap('china', chinaMapData);

// 渲染省份分布图
const chartOption = {
  geo: {
    map: 'china',
    roam: true,
    label: { show: true }
  },
  series: [{
    type: 'scatter',
    coordinateSystem: 'geo',
    data: architectureLocationData
  }]
};
```

### 4.3 Three.js开源模型与示例

| 资源类型 | 来源 | 许可协议 | 用途说明 | 参考链接 |
|---------|------|---------|---------|-----------|
| **Three.js官方示例** | Three.js GitHub仓库 | MIT License | 3D场景管理、Gizmo控制、材质系统参考实现 | [github.com/mrdoob/three.js/tree/dev/examples](https://github.com/mrdoob/three.js/tree/dev/examples) |
| **BufferGeometryUtils** | Three.js addons模块 | MIT License | 几何体合并、计算工具，用于优化场景性能 | [github.com/mrdoob/three.js/blob/dev/examples/jsm/utils/BufferGeometryUtils.js](https://github.com/mrdoob/three.js/blob/dev/examples/jsm/utils/BufferGeometryUtils.js) |

**使用说明**:
- Three.js官方示例仅作为实现参考，未直接复制代码
- BufferGeometryUtils作为Three.js addons模块，按MIT License允许使用
- 所有3D构件模型均为项目自主设计开发，未使用外部模型资源

---

## 5. 开发工具依赖

### 5.1 项目级开发工具

| 工具名称 | 版本 | 许可协议 | 用途说明 | 官网/仓库 |
|---------|------|---------|---------|-----------|
| **concurrently** | ^8.2.2 | MIT License | 并行命令执行工具，同时启动前端与后端开发服务器 | [github.com/open-cli/concurrently](https://github.com/open-cli/concurrently) |

### 5.2 代码质量工具（未实际安装但推荐使用）

以下工具虽未在package.json中声明，但在项目开发过程中建议使用：

| 工具名称 | 许可协议 | 用途说明 | 官网/仓库 |
|---------|---------|---------|-----------|
| **ESLint** | MIT License | JavaScript代码质量检查工具，规范代码风格 | [eslint.org](https://eslint.org/) |
| **Prettier** | MIT License | 代码格式化工具，统一代码排版风格 | [prettier.io](https://prettier.io/) |
| **Husky** | MIT License | Git钩子管理工具，提交前自动检查代码质量 | [typicode.github.io/husky](https://typicode.github.io/husky) |

---

## 6. 许可协议兼容性说明

### 6.1 许可协议兼容矩阵

华夏营造项目采用MIT License，以下列出各开源依赖的许可协议兼容性：

| 许可协议类型 | 兼容性 | 说明 |
|-------------|--------|------|
| **MIT License** | ✅ 完全兼容 | 与项目MIT协议一致，可自由使用、修改、分发 |
| **Apache-2.0 License** | ✅ 完全兼容 | Apache-2.0与MIT兼容，允许商业使用，需保留版权声明 |
| **BSD License** | ✅ 完全兼容 | BSD与MIT兼容，允许商业使用 |
| **ISC License** | ✅ 完全兼容 | ISC与MIT几乎相同，允许商业使用 |
| **GPL License** | ❌ 不兼容 | GPL要求衍生作品同样开源，与MIT不兼容（本项目未使用GPL库） |
| **LGPL License** | ⚠️ 部分兼容 | LGPL允许商业使用但有限制（本项目未使用LGPL库） |

### 6.2 商业使用合规性

**完全合规**：所有使用的开源依赖均采用MIT、Apache-2.0等宽松许可协议，允许：

1. ✅ 商业使用与销售
2. ✅ 修改与二次开发
3. ✅ 分发与 sublicensing
4. ✅ 私有使用与闭源

**必须遵守的要求**：

1. **保留版权声明**：所有MIT/Apache-2.0库的原始版权声明和许可协议文本需在分发时保留
2. **Apache-2.0特殊要求**：如修改Apache许可的文件，需注明修改内容
3. **声明非担保**：MIT协议明确声明软件"按原样提供"，无任何担保

### 6.3 依赖声明与版权管理

项目已通过以下方式遵守开源协议要求：

```json
// package.json中的完整依赖声明
{
  "dependencies": {
    "vue": "^3.5.0",
    "three": "^0.170.0",
    "axios": "^1.8.0",
    // ... 所有依赖均明确声明版本与来源
  }
}
```

**版权声明管理**：
- 所有npm依赖安装后自动下载原始LICENSE文件
- 分发时需包含所有依赖的LICENSE文件（通常在node_modules/*/LICENSE）
- 项目LICENSE文件已明确声明MIT协议

---

## 7. 致谢声明

华夏营造项目的成功离不开开源社区的贡献，特此致谢以下开源项目与团队：

### 7.1 核心框架致谢

```
感谢 Vue.js 团队 (尤雨溪 Evan You 及贡献者)
提供了优雅、高效的渐进式JavaScript框架，让前端开发变得愉悦

感谢 Three.js 团队 (Mr.doob 及贡献者)
创造了强大的WebGL 3D渲染引擎，让Web端3D交互成为可能

感谢 Node.js 团队 (Ryan Dahl 及贡献者)
构建了高性能的JavaScript运行时，让前后端技术栈统一

感谢 Express.js 团队 (TJ Holowaychuk 及贡献者)
设计了简洁、灵活的Web应用框架，简化了后端开发
```

### 7.2 数据可视化致谢

```
感谢 Apache ECharts 团队
提供了开源免费的数据可视化解决方案，让数据分析直观易懂
特别感谢提供的免费中国地图数据，助力文化传承项目

感谢 GeoJSON 数据贡献者
提供了标准化的地理数据格式，支持省份地图展示
```

### 7.3 开源生态致谢

```
感谢 DefinitelyTyped 社区
为JavaScript库提供了高质量的TypeScript类型定义，让TS开发更安全

感谢 npm 社区
建立了庞大的开源包生态，让依赖管理变得简单高效

感谢 GitHub 社区
提供了代码托管与协作平台，促进全球开发者协作
```

### 7.4 特殊致谢

```
感谢所有开源贡献者
每一位提交PR、修复Bug、编写文档的贡献者
你们的无私奉献让开源世界更加美好

感谢开源精神
"开源不仅是代码的共享，更是知识与文化的传承"
这与华夏营造"传承古建筑文化"的使命不谋而合
```

---

## 附录：开源依赖完整清单

### A. 前端完整依赖树

```
atca-frontend@1.0.0
├─ 生产依赖 (Production Dependencies)
│  ├─ vue@3.5.0 (MIT)
│  ├─ vue-router@4.5.0 (MIT)
│  ├─ pinia@2.3.0 (MIT)
│  ├─ three@0.170.0 (MIT)
│  ├─ axios@1.8.0 (MIT)
│  ├─ socket.io-client@4.8.3 (MIT)
│  ├─ vue-i18n@9.14.5 (MIT)
│  ├─ @babel/parser@8.0.0 (MIT)
│  └─ @rollup/rollup-win32-x64-msvc@4.62.2 (MIT)
│
├─ 开发依赖 (Development Dependencies)
│  ├─ vite@8.1.0 (MIT)
│  ├─ @vitejs/plugin-vue@6.0.7 (MIT)
│  ├─ vue-tsc@2.2.0 (MIT)
│  ├─ typescript@5.7.0 (Apache-2.0)
│  ├─ vitest@4.1.9 (MIT)
│  ├─ @vue/test-utils@2.4.6 (MIT)
│  ├─ jsdom@26.0.0 (MIT)
│  ├─ cssnano@8.0.2 (MIT)
│  ├─ esbuild@0.25.0 (MIT)
│  ├─ rollup-plugin-visualizer@7.0.1 (MIT)
│  ├─ vite-plugin-html@3.2.2 (MIT)
│  ├─ @types/node@22.0.0 (MIT)
│  └─ @types/three@0.170.0 (MIT)
```

### B. 后端完整依赖树

```
atca-backend@1.0.0
├─ 生产依赖 (Production Dependencies)
│  ├─ express@4.19.2 (MIT)
│  ├─ typescript@5.4.5 (Apache-2.0)
│  ├─ mssql@11.0.0 (MIT)
│  ├─ jsonwebtoken@9.0.2 (MIT)
│  ├─ bcryptjs@2.4.3 (MIT)
│  ├─ bcrypt@6.0.0 (MIT)
│  ├─ zod@3.23.8 (MIT)
│  ├─ socket.io@4.8.3 (MIT)
│  ├─ ioredis@5.11.1 (MIT)
│  ├─ axios@1.7.2 (MIT)
│  ├─ multer@1.4.5-lts.1 (MIT)
│  ├─ helmet@7.1.0 (MIT)
│  ├─ cors@2.8.5 (MIT)
│  ├─ compression@1.8.1 (MIT)
│  ├─ morgan@1.10.0 (MIT)
│  ├─ express-rate-limit@7.2.0 (MIT)
│  ├─ dotenv@16.4.5 (MIT)
│  ├─ etag@1.8.1 (MIT)
│  ├─ uuid@9.0.1 (MIT)
│  └─ reflect-metadata@0.2.2 (Apache-2.0)
│
├─ 开发依赖 (Development Dependencies)
│  ├─ tsx@4.11.0 (MIT)
│  ├─ jest@30.4.2 (MIT)
│  ├─ ts-jest@29.4.11 (MIT)
│  ├─ supertest@7.2.2 (MIT)
│  ├─ swagger-jsdoc@6.3.0 (MIT)
│  ├─ swagger-ui-express@5.0.1 (MIT)
│  ├─ @types/express@4.17.21 (MIT)
│  ├─ @types/node@20.19.43 (MIT)
│  ├─ @types/mssql@9.1.5 (MIT)
│  ├─ @types/jsonwebtoken@9.0.6 (MIT)
│  ├─ @types/bcryptjs@2.4.6 (MIT)
│  ├─ @types/ioredis@5.0.0 (MIT)
│  ├─ @types/cors@2.8.17 (MIT)
│  ├─ @types/compression@1.8.1 (MIT)
│  ├─ @types/multer@1.4.11 (MIT)
│  ├─ @types/morgan@1.9.9 (MIT)
│  ├─ @types/uuid@9.0.8 (MIT)
│  ├─ @types/etag@1.8.4 (MIT)
│  ├─ @types/swagger-jsdoc@6.0.4 (MIT)
│  ├─ @types/swagger-ui-express@4.1.8 (MIT)
│  ├─ @types/supertest@7.2.0 (MIT)
│  ├─ @types/jest@30.0.0 (MIT)
│  └─ @types/bcrypt@6.0.0 (MIT)
```

### C. 第三方资源清单

```
第三方开源资源
├─ ECharts可视化库
│  ├─ echarts.min.js (Apache-2.0)
│  ├─ 来源: Apache ECharts官方
│  └─ 用途: 数据可视化图表
│
├─ 中国地图数据
│  ├─ china.json (Apache-2.0)
│  ├─ 来源: ECharts官方地图示例
│  └─ 用途: 省份古建筑分布地图
│
└─ Three.js官方示例
   ├─ 参考示例代码 (MIT)
   ├─ 来源: Three.js GitHub仓库
   └─ 用途: 3D场景管理参考实现
```

---

## 总结

华夏营造项目严格遵循开源精神与许可协议规范：

1. **所有依赖均为开源软件**：未使用任何商业闭源库
2. **许可协议兼容合规**：100%使用MIT/Apache-2.0等宽松协议库
3. **版权声明完整保留**：所有依赖的LICENSE文件均已保留
4. **商业使用完全合规**：无GPL/LGPL等限制性协议库
5. **致谢声明详尽完整**：感谢所有开源贡献者

**开源承诺**：

```
华夏营造项目将继续秉持开源精神，
为中国古代建筑文化数字化传承贡献力量，
并向全球开源社区致以最诚挚的感谢。

"开源是一种精神，传承是一种责任"
```

---

**文档版本**: v1.0  
**编写团队**: ATCA开发团队  
**最后更新**: 2026-06-30  
**开源合规状态**: ✅ 完全合规