# TinyLeap | TinyLeap 行为设计助手

[English](#english) | [简体中文](#简体中文)

---

## English

TinyLeap is a specialized AI tool designed to help users identify and implement high-impact, easy-to-do behaviors based on the **Fogg Behavior Model (B=MAP)**.

### 🌟 Key Features

-   **Vision Brainstorming**: Generate a list of actionable behaviors tailored to your core vision.
-   **AI Coach**: Interactive dialogue to evaluate the "Impact" and "Ability" of your chosen behavior.
-   **Rational Score**: Visualize behaviors on a 2D coordinate system to identify "Golden Behaviors".
-   **Agent-Based Architecture**: Powered by 3 specialized LangChain agents (Designer, Validator, Coach).

### 🛠 Tech Stack

-   **Frontend**: React 19, TypeScript, Tailwind CSS 4, Framer Motion
-   **AI Framework**: LangChain TS
-   **State Management**: React Hooks
-   **Icons**: Lucide React

### 🚀 Getting Started

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-repo/tinyleap.git
    cd tinyleap
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    VITE_LLM_API_KEY=your_api_key
    VITE_LLM_BASE_URL=https://api.openai.com/v1
    VITE_LLM_MODEL=gpt-4o
    ```

4.  **Run development server**:
    ```bash
    pnpm dev
    ```

---

## 简体中文

TinyLeap 行为设计助手是一款基于 **Fogg 行为模型 (B=MAP)** 的专业 AI 工具，旨在帮助用户识别并实施高影响力、易执行的“黄金行为”。

### 🌟 核心功能

-   **愿景头脑风暴**：根据您的核心愿景，生成一系列可执行的行为建议。
-   **AI 行为教练**：通过互动对话，深度评估所选行为的“影响力”与“可行性”。
-   **理性评分系统**：在二维坐标系中可视化行为，精准定位“黄金行为”。
-   **Agent 架构**：由 3 个专业的 LangChain Agent（设计者、校验者、教练）驱动。

### 🛠 技术栈

-   **前端**：React 19, TypeScript, Tailwind CSS 4, Framer Motion
-   **AI 框架**：LangChain TS
-   **状态管理**：React Hooks
-   **图标**：Lucide React

### 🚀 快速开始

1.  **克隆项目**：
    ```bash
    git clone https://github.com/your-repo/tinyleap.git
    cd tinyleap
    ```

2.  **安装依赖**：
    ```bash
    pnpm install
    ```

3.  **环境变量配置**：
    在根目录创建 `.env` 文件：
    ```env
    VITE_LLM_API_KEY=你的_API_KEY
    VITE_LLM_BASE_URL=https://api.openai.com/v1
    VITE_LLM_MODEL=gpt-4o
    ```

4.  **启动开发服务器**：
    ```bash
    pnpm dev
    ```

---

## License

MIT
