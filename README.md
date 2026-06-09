# NestJS 用户认证系统

## 🛠 技术栈
- Backend: NestJS + TypeORM + MySQL
- Database: MySQL
- Authentication: Passport JWT
- Security: bcrypt
- Validation: class-validator + class-transformer

## 🚀 启动指南 (How to Run)
1. 确保 Docker Desktop 已启动。
2. 在根目录执行：`docker compose up --build`
3. 等待容器启动完成...

## 🔗 服务地址 (Services)
- Backend: http://localhost:3000
- Database: localhost:3306 (user: root / pass: root)

## 🧪 测试账号
- Test User: test / 123456

## 📁 项目目录结构
```
src/
├── auth/             # 认证模块
│   ├── dto/          # 数据传输对象
│   ├── strategies/   # 认证策略
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── auth.module.ts
├── users/            # 用户模块
│   ├── entities/     # 实体定义
│   └── users.module.ts
├── common/           # 公共组件
│   ├── filters/      # 异常过滤器
│   ├── interceptors/ # 响应拦截器
│   └── decorators/   # 装饰器
├── app.module.ts     # 根模块
└── main.ts           # 入口文件
```

## 📡 API 接口

### 用户注册
- **URL**: `/auth/register`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "username": "test",
    "password": "123456"
  }
  ```

### 用户登录
- **URL**: `/auth/login`
- **Method**: POST
- **Request Body**:
  ```json
  {
    "username": "test",
    "password": "123456"
  }
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "data": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "message": "Success"
  }
  ```

### 个人信息查询
- **URL**: `/auth/profile`
- **Method**: GET
- **Headers**:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Response**:
  ```json
  {
    "code": 200,
    "data": {
      "id": 1,
      "username": "test",
      "createdAt": "2024-01-23T00:00:00.000Z",
      "updatedAt": "2024-01-23T00:00:00.000Z"
    },
    "message": "Success"
  }
  ```
