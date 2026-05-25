---
title: "Daily Digest: Saturday, 18 April 2026"
date: 2026-04-18
tags: ["ai", "news", "digest", "model_release", "hardware", "open_source", "reasoning", "ai_agents", "ai_safety"]
summary: "AI and technology news digest for Saturday, 18 April 2026"
---

# Daily Digest: Saturday, 18 April 2026

Welcome to today's roundup of the most interesting developments in AI and technology.

## Research & Products

### [Update] GHOST v2.1: Full Native Windows Support is Live.

FOR THE UNINITIATED: GHOST is an open source environment manager that breaks the NVIDIA monopoly. It allows you to run high performance AI models on AMD hardware by automatically injecting ZLUDA and ROCm layers into your Windows environment. No Linux, no complex WSL2 setups, and no driver hacking required. KEY FEATURES Full Windows Native Support: Runs directly in PowerShell with a hardened virtualization layer. Auto Hardware Mapping: Scans your system and spoofs the exact RDNA architecture

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sp7yhz/update_ghost_v21_full_native_windows_support_is/)

---

### Lore 0.2.0 - the open source local knowledge management app is now much smarter, with a visible reasoning stream, and non-destructive embedding migration

Quick update on Lore, the local-first memory app I posted here around v0.1.0. It's a tray app: global shortcut → chat bar → save or recall in natural language. Everything stays on your machine. v0.2.0 highlights: \- ThinkingStream: you watch the agent's reasoning, retrieval, and tool calls in real time. \- Embedding-model migration is now non-destructive. You can swap from nomic-embed to mxbai-embed (or whatever) without losing data; the new embeddingTableSync rebuilds in place

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sp5d6l/lore_020_the_open_source_local_knowledge/)

---

### Has PP improved enough on m5 max to go for 128gb?

Few years ago I got caught up in the hype on here for the m1 max 64gb, everyone saying it was great for local, but the reality was pp sucked so bad it wasn't worth using on anything but tiny models. Thinking of upgrading to m5 max, just wondering what the sweet spot is for ram? Can you actually utilise the full 128gb and still have acceptable pp speed for large ctx for agentic coding?

[Read more](https://reddit.com/r/LocalLLaMA/comments/1soz4b4/has_pp_improved_enough_on_m5_max_to_go_for_128gb/)

---

### Qwen 3.6 + vLLM + Docker + 2x RTX 3090 setup, working great!

Our nonprofit association has an AI server with 2x RTX 3090 and I finally switched over to vLLM to get better performance for multiple users. Here's my docker compose file: services: vllm: image: vllm/vllm-openai:latest container_name: vllm deploy: resources: reservations: devices: - driver: nvidia count: all capabilities: [gpu] environment: - VLLM_API_KEY

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sp761q/qwen_36_vllm_docker_2x_rtx_3090_setup_working/)

---

### What happens when you rip out the residual stream and replace it with a structured workspace (Research Paper - CWT)

Over the last month I've been working on a custom architecture that fully replaces the residual stream transformers use with a structured workspace. The goal isn't to claim "I beat transformers", it's a thought experiment into what happens structurally when you enforce a workspace instead, and where the compute actually goes. The findings were fun to discover and very interesting. CWT has 22.9M core compute (attn+FFN) vs 41.7M in the compute-matched baseline, and comes within 1.7% PPL, rough

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sp5icr/what_happens_when_you_rip_out_the_residual_stream/)

---

### Prefill-as-a-Service: KVCache of Next-Generation Models Could Go Cross-Datacenter

^(Just sharing here, I'm not sure whether this is suitable/useful for Local models or not.) ^(This is by Kimi/Moonshot.) [^(Source Tweet)](https://xcancel.com/Kimi_Moonshot/status/2045461663898599472#m) We push Prefill/Decode disaggregation beyond a single cluster: cross-datacenter + heterogeneous hardware, unlocking the potential for significantly lower cost per token. This was previously blocked by KV cache transfer overhead. The key enabler is our hybrid model (**Kimi Linear**), which

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sp216x/prefillasaservice_kvcache_of_nextgeneration/)

---

### Should I be seeing more of a performance leap when using NVFP4, INT4, FP8 with VLLM over MXFP4, Q4, and Q8 with llama.cpp based inference on Blackwell based GPUs?

I hope I am doing something wrong here but I am seeing about almost double the t/s using LM studio with Qwen3.5 and Nemotron models than I am seeing with Nvidia’s own vLLM containers built for Spark. I was surprised I was only getting 15-ish t/s with Nemotron Nano NVFP4 in VLLM with Nvidia’s recommended settings and getting 30 t/s using Unsloths MXFP4 of Nemotron Nano in LM Studio. I have two RTX Pro 6000’s. One is dedicated to Ollama for on demand switching, the other is dedicated to a single

[Read more](https://reddit.com/r/LocalLLaMA/comments/1soz8en/should_i_be_seeing_more_of_a_performance_leap/)

---

## Tags: hardware, ai_safety, open_source

### easyaligner: Forced alignment with GPU acceleration and flexible text normalization (compatible with all w2v2 models on HF Hub) [P]

https://preview.redd.it/f4d5krhkjyvg1.png?width=1020&amp;format=png&amp;auto=webp&amp;s=11310f377b22abbe3dd110cc7d362ba8aae35f8d I have built [`easyaligner`](https://kb-labb.github.io/easyaligner/), a forced alignment library designed to be performant and easy to use. Having worked with preprocessing hundreds of thousands of hours of audio and text for training speech-to-text models, I found that the available open source forced alignment libraries often missed some convenience features. For o

[Read more](https://reddit.com/r/MachineLearning/comments/1soyqfw/easyaligner_forced_alignment_with_gpu/)

---

## Policy & Ethics

### Agentic coding Qwen 3.6, Q6_K 125k context vs Q5_K_XL 200k context

What would you choose if you were in my shoes? How viable is 125k for agentic coding really? is "compact" really good enough, or would you go with Q6\_K 125k? I am getting around 165-170 tok/sec with either config with my 5090.

[Read more](https://reddit.com/r/LocalLLaMA/comments/1sogbck/agentic_coding_qwen_36_q6_k_125k_context_vs_q5_k/)

---


*This digest was automatically generated.*
