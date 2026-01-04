<h1 align="center">Open Copilot for Obsidian</h1>

<h2 align="center">
A Modified Version of Copilot for Obsidian with Custom API Support
</h2>

<p align="center">
  <img src="https://img.shields.io/github/v/release/ZUENS2020/open-copilot?style=for-the-badge&sort=semver" alt="GitHub release (latest SemVer)">
  <img src="https://img.shields.io/badge/license-AGPL%20v3-blue?style=for-the-badge" alt="License: AGPL v3">
</p>

<p align="center">
  <a href="https://github.com/ZUENS2020/open-copilot/issues">Report Bug</a> |
  <a href="https://github.com/ZUENS2020/open-copilot/issues">Request Feature</a>
</p>

---

## License and Attribution

**This project is a modified version of [Copilot for Obsidian](https://github.com/logancyang/obsidian-copilot) by Logan Yang, originally licensed under the GNU Affero General Public License v3 (AGPL-3.0).**

This modified version is distributed under the same AGPL-3.0 license. You can find the full license text in the [LICENSE](LICENSE) file.

### Original Project
- **Original Author**: Logan Yang (Brevilabs Team)
- **Original Repository**: https://github.com/logancyang/obsidian-copilot
- **Original License**: GNU Affero General Public License v3.0

### Modifications Made
This fork includes the following significant modifications:
- **Removed Copilot Plus functionality** - All premium/subscription features have been removed
- **Added Custom API provider** - Users can now configure their own API endpoints for both chat and embedding models
- **Updated documentation** - Reflects the removal of Plus features and addition of custom API support
- **Updated repository information** - Points to this fork instead of the original repository

### License Notice
```
Copilot for Obsidian
Copyright (C) 2024 Logan Yang
Copyright (C) 2025 ZUENS2020

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
```

---

## About Open Copilot

_Open Copilot for Obsidian_ is a modified version of the original Copilot plugin. It is your in‑vault AI assistant with chat-based vault search, powerful context processing, and ever-expanding agentic capabilities within Obsidian's highly customizable workspace - all while keeping your data under **your** control.

### Key Differences from Original

| Feature | Original Copilot | Open Copilot (This Fork) |
|---------|------------------|--------------------------|
| Custom API Provider | ❌ No | ✅ Yes (Chat + Embedding) |
| Copilot Plus | ✅ Yes (Premium) | ❌ Removed |
| Local Models (Ollama/LM Studio) | ✅ Yes | ✅ Yes |
| Multiple AI Providers | ✅ Yes | ✅ Yes |
| License | AGPL-3.0 | AGPL-3.0 |

## Key Features

- **🔒 Your data is 100% yours**: Local search and storage, and full control of your data if you use self-hosted models.
- **🧠 Bring Your Own Model**: Use your own custom API endpoints or tap into OpenAI-compatible providers
- **🖼️ Multimedia understanding**: Drop in webpages, YouTube videos, images, PDFs, EPUBS for quick insights.
- **🔍 Smart Vault Search**: Search your vault with chat, no setup required. Embeddings are optional.
- **✍️ Composer and Quick Commands**: Interact with your writing with chat, apply changes with 1 click.
- **🗂️ Project Mode**: Create AI-ready context based on folders and tags.

## Table of Contents

- [Get Started](#get-started)
  - [Install Open Copilot](#install-open-copilot)
  - [Configure Custom API](#configure-custom-api)
- [Usage](#usage)
- [FAQ](#faq)
- [License](#license-and-attribution)

## Get Started

### Install Open Copilot

1. Open **Obsidian → Settings → Community plugins**.
2. Turn off **Safe mode** (if enabled).
3. Click **Browse**, search for **"Copilot"**.
4. Click **Install**, then **Enable**.

### Configure Custom API

**Step 1: Set API Key**

1. Go to **Obsidian → Settings → Copilot → Basic** and click **Set Keys**.
2. Find **Custom API** and enter your API key.

**Step 2: Add Chat Model**

1. Go to **Settings → Copilot → Models → Chat Models → Add Model**
2. Select **Provider**: `Custom API`
3. Enter **Model Name**: Your chat model name (e.g., `gpt-4`, `claude-3-5-sonnet-20241022`)
4. Enter **Base URL**: Your API endpoint (e.g., `https://api.example.com/v1`)
5. Click **Add**

**Step 3: Add Embedding Model (Optional, for Vault QA)**

1. Go to **Settings → Copilot → Models → Embedding Models → Add Model**
2. Select **Provider**: `Custom API`
3. Enter **Model Name**: Your embedding model name
4. Enter **Base URL**: Your API endpoint
5. Click **Add**

**Step 4: Set Default Model**

1. In **Settings → Copilot → Basic**, select your newly added model as the **Default Chat Model**.

## Usage

### Chat Mode: Reference Notes and Discuss Ideas

Use `@` to add context and chat with your note.

**Example**:
> _Summarize [[Q3 Retrospective]] and identify the top 3 action items for Q4 based on the notes in {01-Projects}._

### Vault QA Mode: Chat with Your Entire Vault

**Example**:
> _What are the recurring themes in my research regarding the intersection of AI and SaaS?_

### Command Palette

Access all commands in chat window via `/` or via right-click menu on selected text.

**Quick Commands**:
- `Ctrl/Cmd + K` - Quick Command (apply action without opening chat)
- `Ctrl/Cmd + L` - Add selection to chat context

## FAQ

<details>
  <summary><strong>How do I use my own API?</strong></summary>

1. Set your Custom API key in **Settings → Copilot → API Keys**
2. Add a new model in **Settings → Copilot → Models**
3. Select "Custom API" as the provider
4. Enter your model name and base URL
</details>

<details>
  <summary><strong>Why isn't Vault search finding my notes?</strong></summary>

- Ensure you have configured an embedding model from your AI provider
- Ensure your Copilot indexing is up-to-date
- If issues persist, run **Force Re-Index** from the Command Palette
</details>

<details>
  <summary><strong>Which AI providers are supported?</strong></summary>

**Chat Models**:
- Custom API (your own endpoint)
- OpenRouter, OpenAI, Anthropic, Google (Gemini), XAI (Grok)
- Azure OpenAI, Groq, Cohere, Mistral, DeepSeek, SiliconFlow
- Local: Ollama, LM Studio

**Embedding Models**:
- Custom API (your own endpoint)
- OpenAI, Google, Cohere, Azure OpenAI
- SiliconFlow
- Local: Ollama, LM Studio
</details>

<details>
  <summary><strong>What happened to Copilot Plus?</strong></summary>

Copilot Plus was a premium subscription service in the original Copilot plugin. This fork has removed all Plus functionality and replaced it with the ability to use your own Custom API endpoints. You get the same features by configuring your own API keys.
</details>

## Need Help?

- Report bugs: [https://github.com/ZUENS2020/open-copilot/issues](https://github.com/ZUENS2020/open-copilot/issues)
- Feature requests: [https://github.com/ZUENS2020/open-copilot/issues](https://github.com/ZUENS2020/open-copilot/issues)

## Authors

**Original Project**: Logan Yang (Brevilabs Team)

**This Fork**: ZUENS2020 | GitHub: [ZUENS2020](https://github.com/ZUENS2020)

---

## License

GNU Affero General Public License v3.0 (AGPL-3.0)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
