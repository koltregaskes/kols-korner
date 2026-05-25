---
title: "Daily Digest: Wednesday, 20 May 2026"
date: 2026-05-20
tags: ["ai", "news", "digest", "model_release", "ai_agents", "reasoning", "product_launch", "hardware", "open_source", "announcement", "industry_move", "policy", "opinion", "funding"]
summary: "AI and technology news digest for Wednesday, 20 May 2026"
---

# Daily Digest: Wednesday, 20 May 2026

Welcome to today's roundup of the most interesting developments in AI and technology.

## Research & Products

### Google releases Gemini 3.5 Flash for complex agentic workflows, coding, and reasoning at 289 tokens per second and higher scores than Gemini 3.1 Pro on Terminal-Bench 2.1, GDPval-AA, and MCP Atlas — Large token quotas appeared in Google Cloud Console before wider rollout.

[Read more](https://www.digg.com/ai/9p5cqkyn?rank=2)

---

### Cohere releases Command A+, its most advanced large language model optimized to run efficiently on limited hardware while delivering high performance and available as open-source software — The launch targets developers and organizations with constrained compute resources.

[Read more](https://www.digg.com/ai/tvrhpn35?rank=1)

---

### Edison Scientific announces partnership with Incyte to deploy Kosmos AI agent across full drug development pipeline from molecular design through FDA approval — Incyte becomes first company to integrate the system end-to-end.

[Read more](https://www.digg.com/ai/r5p7scr1?rank=3)

---

### Cohere releases Command A+, its most advanced large language model optimized to run efficiently on limited hardware while delivering high performance and available as open-source software

[Read more](https://www.digg.com/ai/tvrhpn35)

---

### Cursor AI releases Composer 2.5 as its most powerful model, improving long-running tasks and complex instruction adherence on the Kimi pretrain base with 85 percent of compute for further training.

[Read more](https://www.digg.com/ai/8eee35ea-eb73-4291-b803-e7ed89df3fba)

---

## Policy & Ethics

### Qwen 3.6 35B GGUF: NTP vs MTP quantization results across GPUs and CPUs

Hey r/LocalLLaMA, We’ve released our ByteShape Qwen 3.6 35B GGUF quantizations in two families: standard NTP (Next Token Prediction or non-MTP) and MTP. [Blog](https://byteshape.com/blogs/Qwen3.6-35B-A3B/) / [Download NTP Models](https://huggingface.co/byteshape/Qwen3.6-35B-A3B-GGUF) / [Download MTP Models](https://huggingface.co/byteshape/Qwen3.6-35B-A3B-MTP-GGUF) **TL;DR** * For NTP, “pick the largest quant that fits” worked surprisingly well. * Lower bpw was not automatically better: our largest model was very hard to beat on quality/speed, including prompt processing and token generation. * MTP gave a real GPU generation-speed boost, usually around 20–40%, but the extra memory footprint can change what fits. * MTP speedup is heavily workload dependent. * CPU MTP was not attractive in our tests, so our CPU recommendation remains NTP. * We excluded MMLU from this release because Qwen 3.6 showed answer-format compliance issues in full precision, making it a noisy quantization-comparison signal. For this release, we tried to make the comparison more of a small hardware study than just a model drop. We benchmarked the original model and a broader set of quantized variants across RT…

[Read more](https://reddit.com/r/LocalLLaMA/comments/1tipihx/qwen_36_35b_gguf_ntp_vs_mtp_quantization_results/)

---

### PrivateScribe.ai - Fully local, MIT licensed, free AI transcription built with HIPAA/legal safeguards in mind - One Year Update!

I first posted about [PrivateScribe.ai](http://PrivateScribe.ai) \~1yr ago and have recently jumped back intent on bringing it to a functionality that makes it actually usable by non-technical users. One year ago it worked but only the bare minimum. Since then I've gotten ⭐️74 github stars!⭐️ and have had a few meetings with people that has inspired me to push it forward. PrivateScribe is a fully local, open source AI transcription platform using FasterWhisper, pyannote, and Ollama, built with Vite/Flask/SQLite. I am an ER physician in my second life and I've approached a lot of this project with a focus on privacy and specifically HIPAA workflow requirements. The medical world has been flooded with dozen(s) of AI-transcription startups focusing on free tiers with the ever-questionable data policies or permanent subscriptions and I'm still strongly of the opinion this is a solvable problem locally especially for small clinics, therapists, and beyond medicine into law, counseling, and personal use. Excited to share the major updates: **A signed, notarized, bundled macOS app** \- launch ETA this Friday! Ollama, pyannote, everything bundled into the application so no separate install…

[Read more](https://reddit.com/r/LocalLLaMA/comments/1thw7x9/privatescribeai_fully_local_mit_licensed_free_ai/)

---

## Tags: ai_agents, funding, crypto_defi

### Exa raised $250 million in a Series C at a $2.2 billion valuation led by Andreessen Horowitz, reporting 400,000 developers and 5,000 company adopters for its AI agent search platform — Token usage grew 20x for agent-driven queries.

[Read more](https://www.digg.com/ai/1te0bqvt?rank=2)

---


*This digest was automatically generated.*
