<h1 align="center">Open Copilot for Obsidian</h1>

<h2 align="center">
Your AI Copilot: Chat with Your Second Brain, Learn Faster, Work Smarter.
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

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). You can find the full license text in the [LICENSE](LICENSE) file.

This project is based on [Copilot for Obsidian](https://github.com/logancyang/obsidian-copilot) by Logan Yang, which is also licensed under AGPL-3.0.

---

## About

_Copilot for Obsidian_ is your in‑vault AI assistant with chat-based vault search, powerful context processing, and ever-expanding agentic capabilities within Obsidian's highly customizable workspace - all while keeping your data under **your** control.

## Key Features

- **🔒 Your data is 100% yours**: Local search and storage, and full control of your data if you use self-hosted models.
- **🧠 Bring Your Own Model**: Use your own custom API endpoints or tap into OpenAI-compatible providers
- **🖼️ Multimedia understanding**: Drop in webpages, YouTube videos, images, PDFs, EPUBS for quick insights.
- **🔍 Smart Vault Search V3**: High-performance, memory-bounded search that combines lexical precision (Search V3) with semantic understanding (Orama). No persistent index files, fast initial scan, and intelligent chunking.
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

### Vault Search V3: Chat with Your Entire Vault

The new search engine ("Search V3") combines fast lexical scanning with intelligent chunking:
- **Lexical Precision**: Uses BM25-based scoring with boosts for tags, folders, and links.
- **Semantic Understanding**: Optional integration with Orama for vector-based meaning search.
- **Memory Efficient**: No massive index files; builds ephemeral indexes on the fly from relevant chunks.
- **Granular Context**: Retrieves specific sections (chunks) of notes rather than dumping entire files into the context.

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

## Need Help?

- Report bugs: [https://github.com/ZUENS2020/open-copilot/issues](https://github.com/ZUENS2020/open-copilot/issues)
- Feature requests: [https://github.com/ZUENS2020/open-copilot/issues](https://github.com/ZUENS2020/open-copilot/issues)

---

## License

GNU Affero General Public License v3.0 (AGPL-3.0)

This program is free software: you can redistribute it and/or modify it under the terms of the GNU Affero General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License along with this program. If not, see <https://www.gnu.org/licenses/>.
