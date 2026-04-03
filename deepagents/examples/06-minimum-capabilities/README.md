# 06 Minimum Capabilities

这是第 6 章配套示例：一个最小可用的 coding agent。

这一章的重点是建立一个最小但完整的 coding task 闭环：

- 读仓库
- 搜索信息
- 给出计划
- 必要时运行命令
- 最后汇报结果

## 运行

```bash
cd deepagents
cp .env.example .env
pnpm install
pnpm dev:06
```

也可以传入自定义任务：

```bash
cd deepagents
pnpm dev:06 -- "阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件"
```

也可以单独进入示例目录运行：

```bash
cd deepagents/examples/06-minimum-capabilities
cp .env.example .env
pnpm install
pnpm dev "阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件"
```

## 默认任务

如果不传任务，示例会默认执行：

```text
阅读当前仓库的 deepagents/README.md，并给出一份执行计划，不修改文件
```

## 当前实现

- 使用共享的 `createCodingAgent`
- 接入最小 coding agent 工具集
- 重点演示“任务闭环”，而不是复杂多代理协作

## 环境变量

这个示例使用标准的 OpenAI 兼容环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `MODEL_NAME`

## 对应文档

- [06-minimum-capabilities.md](/deepagents/docs/06-minimum-capabilities.md)
