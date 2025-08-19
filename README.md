# n8n Bedrock Chat (IAM) – Custom Node

This repository contains an updated n8n custom node that:

- Removes deprecated `getChatTrigger()` usage  
- Removes deprecated `getNextRunIndex()` usage  
- Replaces path aliases with relative imports (so it works outside the n8n monorepo)  
- Compiles to **CommonJS** for n8n’s custom loader  
- **Modified to use AWS IAM credentials from the host container environment**  
- **Supports configurable `top_p` option in the node UI**  

> **Recommended install**: build and run this **inside your running n8n container** so it uses the exact dependency graph n8n ships with (Node version, LangChain/Zod, etc.). Building on the host and copying into the container can lead to subtle version/interop errors.

---

## Quick Start (inside the running container)

1. **Enter the container**
   ```bash
   docker exec -it <n8n-container> bash
   ```

2. **Create the custom nodes directory (if missing)**
   ```bash
   mkdir -p /home/node/.n8n/custom
   cd /home/node/.n8n/custom
   ```

3. **Clone or copy this repo**
   ```bash
   git clone https://github.com/C-Brown/n8n-nodes-bedrock-chat-iam.git n8n-nodes-bedrock-chat-iam
   cd n8n-nodes-bedrock-chat-iam
   ```

4. **Install & build with pnpm**
   ```bash
   pnpm install
   pnpm run build
   ```

5. **Restart n8n** so it loads the new node
   ```bash
   docker restart <n8n-container>
   ```

6. **Verify in logs**
   ```
   Loading custom nodes from: /home/node/.n8n/custom
   Loaded: .../dist/nodes/BedrockChatIAM/BedrockChatIAM.node.js
   ```

7. **Use it in the UI**
   In the n8n editor, click “+” and search for **Bedrock Chat (IAM)**.

---

## AWS IAM Integration

This node has been modified to authenticate against AWS Bedrock using **IAM credentials from the host/container environment**.  

That means you don’t need to embed AWS keys in the node configuration. Instead, provide credentials in the container environment.

The node automatically picks up and uses these credentials when making calls to AWS Bedrock.

---

## `top_p` Sampling Support

The node UI includes a **`top_p` option** under advanced settings.  

- `top_p` controls nucleus sampling — higher values consider more possible tokens, lower values make output more deterministic.  
- Default is `1.0` (no restriction). You can set values between `0.0` and `1.0`.  

This allows fine-tuning model creativity directly from n8n.

---

## Project Layout

```
n8n-nodes-bedrock-chat-iam/
├─ package.json
├─ tsconfig.json
├─ README.md
├─ nodes/
│  └─ BedrockChatIAM/BedrockChatIAM.node.ts
├─ utils/
├─ types/
├─ credentials/
└─ dist/    // created after building (in container)
   └─ nodes/BedrockChatIAM/BedrockChatIAM.node.js
```

---

## Important Configuration

### package.json

```json
{
  "name": "n8n-nodes-bedrock-chat-iam",
  "version": "0.1.0",
  "main": "dist/index.js",
  "n8n": {
    "nodes": [
      "dist/nodes/BedrockChatIAM/BedrockChatIAM.node.js"
    ]
  },
  "scripts": {
    "build": "rimraf dist && tsc -p tsconfig.json"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2019",
    "module": "CommonJS",
    "outDir": "dist",
    "declaration": true,
    "esModuleInterop": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["**/*.ts"],
  "exclude": ["dist", "node_modules"]
}
```

---

## What Changed vs n8n Core

- `getChatTrigger()` → removed  
- `getNextRunIndex()` → removed   
- Path aliases replaced with relative imports  
- Class is a named export implementing `INodeType`  
- **AWS IAM credential passthrough from environment**  
- **New `top_p` property in node options**

---

## Troubleshooting

- **Not a constructor** → Ensure class is a named export and compiled as CommonJS.  
- **Missing @utils/...** → Replace alias with relative import.  
- **Node not in UI** → Must restart container after build.  
- **AWS error** → Ensure `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` are set in container env.  

---
