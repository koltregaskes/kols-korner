---
title: "Daily Digest: Wednesday, 29 July 2026"
date: 2026-07-29
tags: ["ai", "news", "digest", "model_release", "ai_safety", "product_launch", "industry_move", "announcement", "funding", "policy", "hardware", "acquisition", "regulation"]
summary: "AI and technology news digest for Wednesday, 29 July 2026"
---

# Daily Digest: Wednesday, 29 July 2026

This dated roundup collects the most interesting AI and technology developments found for Wednesday, 29 July 2026.

## Research & Products

### Anatomy of a Frontier Lab Agent Intrusion: A Technical Timeline of the July 2026 Incident

<p><strong><a href="https://huggingface.co/blog/agent-intrusion-technical-timeline">Anatomy of a Frontier Lab Agent Intrusion: A Technical Timeline of the July 2026 Incident</a></strong></p> Hugging Face just released this extremely detailed technical description of <a href="https://simonwillison.net/2026/Jul/22/openai-cyberattack/">OpenAI's recent accidental cyberattack against their infrastructure</a>. This attack was <em>very</em> sophisticated, and the resulting document doubles as a crash-course in modern adversarial security approaches.</p> <p>We're still waiting for more details from OpenAI on how their agent broke out of its sandbox. The package proxy that it found a zero-day vulnerability in has now been confirmed as JFrog's Artifactor, and <a href="https://jfrog.com/blog/jfrog-and-openai-collaboration-on-zero-day-security-findings/">JFrog and OpenAI Collaboration on Zero-Day Security Findings</a> from JFrog links to the <a href="https://docs.jfrog.com/releases/docs/artifactory-self-managed-releases#artifactory-7161">Artifactory 7.161.15 release notes</a> which list 8 separate CVEs credited to OpenAI staff members.</p> <p>Having broken out through the HTTP proxy, the agent started by establishing a base of operations for the rest of the attack:</p> <blockquote> <p>[...] the agent escaped its sandbox by exploiting a zero-day in the package registry cache proxy, one of its primary permitted network egress with internet, then abused a public code-evaluation external sandbox hosted on a third-party provider's infrastructure. It was able to run commands as root/admin on that external sandbox and used it as a control, staging, and egress base for the entire campaign: it acted as an external launchpad for the agent.</p> </blockquote> <p>(That "third-party provider" <a href="https://simonwillison.net/2026/Jul/28/akshat-bubna/">turned out to be Modal</a>.)</p> <p>It then spent <strong>five days</strong> - from Thursday 8th to Monday 13th July - executing a classic attack pattern: establishing C2 (command and control), reconnaissance, escalating privileges, dumping configuration information, exfiltrating the target data, and cleaning up after itself.</p> <p>(The first Hugging Face post about the incident followed <a href="https://huggingface.co/blog/security-incident-july-2026">on Thursday 16th</a>, and OpenAI's confession came <a href="https://openai.com/index/hugging-face-model-evaluation-security-incident/">on Tuesday 21st</a>.)</p> <p>Along the way it used all kinds of neat tricks. At one point it found an unsafe Jinja2 template execution and used it to execute arbitrary code:</p> <pre><code>{{ cycler.__init__.__globals__.__builtins__.exec( "import gzip,base64; exec(gzip.decompress(base64.b64decode('<payload>')))" ) }} </code></pre> <p>It broke out of a container within Hugging Face, stole a Kubernetes service-account token, and used that to further explore the network.</p> <p>It monkey-patched the Python socket library to hard-code an IP address when "DNS got in the way":</p> <pre><code>socket.getaddrinfo = lambda *a, **k: [(2, 1, 6, '', ('<pinned-ip>', 443))] </code></pre> <p>It even fired up its own Tailscale network to help exfiltrate data!</p> <pre><code>tailscaled --tun=userspace-networking \ --state=mem: --socket=/tmp/ts.sock \ --socks5-server=127.0.0.1:1055 \ --no-logs-no-support >/tmp/td 2>&amp;1 &amp; </code></pre> <p>The Hugging Face team note that, while a human attacker could have discovered and used the same exploits, the key difference here was <em>speed</em>:</p> <blockquote> <p>Our learning from this type of attack is that machine-speed offense makes ordinary weaknesses more expensive for defenders. LLM agents bring a step increase in the number of paths an attacker can test, the speed at which failed paths can be replaced, and the volume of evidence defenders must interpret.</p> </blockquote> <p>What's clear to me from this is that the very best frontier models, unencumbered by additional guardrails, <strong>will</strong> find an exploit if there is one to be found.</p> <p>The entire software industry needs to up its security game. <p>Tags: <a href="https://simonwillison.net/tags/jinja">jinja</a>, <a href="https://simonwillison.net/tags/python">python</a>, <a href="https://simonwillison.net/tags/security">security</a>, <a href="https://simonwillison.net/tags/ai">ai</a>, <a href="https://simonwillison.net/tags/openai">openai</a>, <a href="https://simonwillison.net/tags/generative-ai">generative-ai</a>, <a href="https://simonwillison.net/tags/llms">llms</a>, <a href="https://simonwillison.net/tags/hugging-face">hugging-face</a>, <a href="https://simonwillison.net/tags/coding-agents">coding-agents</a>, <a href="https://simonwillison.net/tags/ai-security-research">ai-security-research</a>, <a href="https://simonwillison.net/tags/openai-hugging-face-incident">openai-hugging-face-incident</a></p>

[Read more](https://simonwillison.net/2026/Jul/28/anatomy-of-a-frontier-lab-agent-intrusion/#atom-everything)

---

### Burnham is taking a bold risk by busting the big lie of politics – that change is impossible | Frances Ryan

<p>Unequal capitalist societies survive on the premise that certain things are inevitable. Admit that these are political choices, and who knows what voters will demand?</p><p>This is the danger zone. The period when one prime minister leaves office and the next takes over can inspire either dread or delight: a few days in which the country forms a gut reaction to the new government.</p><p>One week on, Andy Burnham has well and truly ditched the slow fatalism that marked Keir Starmer’s early days in power, in favour of the message that help is on the way: from <a href="https://www.theguardian.com/politics/2026/jul/21/burnham-announces-plans-to-cut-vat-on-electricity-bills-as-first-cost-of-living-move?">cost of living support</a> to a pledge to <a href="https://www.theguardian.com/society/2026/jul/24/can-andy-burnham-really-end-rough-sleeping">end rough sleeping</a> and Monday’s commitment to<a href="https://www.theguardian.com/society/2026/jul/27/andy-burnham-vows-to-use-his-political-capital-to-fix-social-care-system?"> fix the social care system</a>.</p> <a href="https://www.theguardian.com/commentisfree/2026/jul/28/andy-burnham-bold-start-change-prime-minister">Continue reading...</a>

[Read more](https://www.theguardian.com/commentisfree/2026/jul/28/andy-burnham-bold-start-change-prime-minister)

---

### Apple launches ‘Upgrade’ device leasing program in partnership with Klarna

The rollout of the program comes as Apple has been struggling with supply chain issues related to "RAMageddon," which refers to the industry-wide shortage of memory chips that is driving up the price of hardware.

[Read more](https://techcrunch.com/2026/07/28/apple-launches-upgrade-device-leasing-program-in-partnership-with-klarna/)

---

### sqlite-utils 3.39.1

<p><strong>Release:</strong> <a href="https://github.com/simonw/sqlite-utils/releases/tag/3.39.1">sqlite-utils 3.39.1</a></p> <p>I back-ported <a href="https://github.com/simonw/sqlite-utils/issues/815">a fix</a> for <code>table.delete_where()</code> that shipped in version 4.</p> <p>Tags: <a href="https://simonwillison.net/tags/sqlite-utils">sqlite-utils</a></p>

[Read more](https://simonwillison.net/2026/Jul/26/sqlite-utils/#atom-everything)

---

### ‘No plan, no budget, no promotion’: how a genre-mashing masterpiece by a forgotten New York beatnik blew Gen Z away

<p>How did an album that began life in 1984 – fusing disco, folk, synth-pop and Chinese opera – end up as ‘one of 2026’s most thrilling releases’? And why does its creator call himself Nirosta Steel?</p><p>‘It’s kind of mind-bending,” says 69-year old Steven Hall. For the last three years, the Scottish musician has been living with his lawyer husband a few hours south of Chicago, driving an Uber for some additional income. Now, suddenly, he is being lauded by critics for his double LP My Skyscraper, released last month under the name Nirosta Steel. Compiling material recorded between 1984 and 2025, it charts a sonic landscape through disco, folk and synth-pop with detours into Chinese opera and ecclesiastical a cappella. Pitchfork <a href="https://pitchfork.com/reviews/albums/nirosta-steel-my-skyscraper/">called it</a> “an archival triumph and one of the year’s most thrilling new releases”.</p><p>It all came about when a label head, impressed with Nirosta Steel’s 2014 album Cool Fire, asked Hall if he had any more music. “He didn’t know what he was in for,” says Hall. The couple of dozen unreleased songs he shared spanned four decades of eclectic musicianship, and revealed a globe-trotting life and career that intersects with experimental icons such as Arthur Russell and Allen Ginsberg. Now My Skyscraper seems poised to admit Hall into that rarified pantheon of historically salvaged artists whose time has belatedly arrived.</p> <a href="https://www.theguardian.com/culture/2026/jul/29/my-skyscraper-nirosta-steel-new-york-beatnik">Continue reading...</a>

[Read more](https://www.theguardian.com/culture/2026/jul/29/my-skyscraper-nirosta-steel-new-york-beatnik)

---

### FIFA proposes plan to sell stakes in the World Cup, angering UEFA

Football's world governing body announces plans to sell stakes of up to 20 percent in the World Cup and other events.

[Read more](https://www.aljazeera.com/sports/2026/7/29/fifa-proposes-plan-to-sell-stakes-in-the-world-cup-angering-uefa?traffic_source=rss)

---

### FIFA proposes plan to sell stakes in the World Cup, angering UEFA

Football's world governing body announces plans to sell stakes of up to 20 percent in the World Cup and other events.

[Read more](https://www.aljazeera.com/news/2026/7/29/fifa-proposes-plan-to-sell-stakes-in-the-world-cup-angering-uefa?traffic_source=rss)

---

### Saudi Arabia joins US in strikes on Iran-backed militias in Iraq

US Central Command says proxy groups launched attacks against US bases and Saudi energy infrastructure.

[Read more](https://www.bbc.co.uk/news/articles/c70g6y24d76o?at_medium=RSS&at_campaign=rss)

---

## Policy & Ethics

### Mooted WA oil refinery ‘dinosaur technology’ amid clean energy transition, experts say

<p>A feasibility study for the Western Australian project will show the project is uneconomic and requires government subsidies, experts say</p><ul><li><p><a href="https://www.theguardian.com/australia-news/live/2026/jul/29/ben-carroll-victoria-premier-jacinta-allan-labor-abs-inflation-data-nsw-icac-inquiry-antisemitism-royal-commission-ntwnfb">Follow our Australia news live blog for latest updates</a></p></li><li><p><a href="https://www.theguardian.com/environment/2025/mar/10/sign-up-for-the-clear-air-australia-environment-newsletter-with-adam-morton?CMP=cvau_sfl">Sign up for climate and environment editor Adam Morton’s free Clear Air newsletter here</a></p></li><li><p>Get our <a href="https://www.theguardian.com/email-newsletters?CMP=cvau_sfl">breaking news email</a>, <a href="https://app.adjust.com/w4u7jx3">free app</a> or <a href="https://www.theguardian.com/australia-news/series/full-story?CMP=cvau_sfl">daily news podcast</a></p></li></ul><p>Leading Australian climate policy experts say a new oil refinery in Western Australia would be an investment in “dinosaur technology” that would require public subsidy and do little to solve the country’s fuel security.<br><br><a href="https://www.theguardian.com/australia-news/2026/jul/27/potential-for-first-australian-oil-refinery-in-60-years-as-treasurer-braces-for-inflation-from-middle-east-war">The Albanese government announced a $4m early-stage feasibility study</a> with the WA government for a new oil refinery in the Pilbara region on Tuesday, but experts said the money would be better spent on green technology to reduce Australia’s reliance on fossil fuels.</p><p>Experts told Guardian Australia doing the feasibility study was not a bad idea, but would ultimately show the project would be uneconomic and would require government subsidies.</p><p><strong><a href="https://www.theguardian.com/environment/2025/mar/10/sign-up-for-the-clear-air-australia-environment-newsletter-with-adam-morton?CMP=copyembed">Sign up to get climate and environment editor Adam Morton’s Clear Air column as a free newsletter</a></strong></p> <a href="https://www.theguardian.com/australia-news/2026/jul/29/western-australia-oil-refinery-feasibility-study">Continue reading...</a>

[Read more](https://www.theguardian.com/australia-news/2026/jul/29/western-australia-oil-refinery-feasibility-study)

---

### Insilico to present Phase 1 trial data for AI-designed cancer drug at ESMO 2026

Insilico Medicine announced that first-in-human Phase 1 trial data for ISM6331 has been accepted for a Rapid Oral presentation at the European Society for Medical Oncology Congress 2026, scheduled for 23-27 October 2026, in Madrid, Spain. The Rapid Oral session is listed as Developmental Therapeutic, abstract number 997, and is scheduled for Sunday, 25 October […] The post Insilico to present Phase 1 trial data for AI-designed cancer drug at ESMO 2026 appeared first on Longevity.Technology .

[Read more](https://longevity.technology/news/insilico-to-present-phase-1-trial-data-for-ai-designed-cancer-drug-at-esmo-2026/)

---

### Montana’s Right-to-Try Law Enters a New Phase

Montana’s first experimental treatment review board has brought three longevity heavyweights into the state’s effort to expand access to experimental therapies. How much regulation is too much? […]

[Read more](https://lifespan.io/montanas-right-to-try-law-enters-a-new-phase/)

---

## Industry

### Recursive Superintelligence signs $410M compute deal with Amazon

Recursive’s emphasis on self-improving AI systems means much of the budget that would traditionally go toward headcount and operations is put straight into compute, as the company seeks to automate its own product development process.

[Read more](https://techcrunch.com/2026/07/28/recursive-superintelligence-signs-400-compute-deal-with-amazon/)

---

### Cyera agrees to acquire Oasis Security for $1B to safeguard proliferating AI agents

The deal is Cyera's third acquisition this year.

[Read more](https://techcrunch.com/2026/07/28/cyera-agrees-to-acquire-oasis-security-for-1b-to-safeguard-proliferating-ai-agents/)

---

### Longevity AI, Clalit collaborate to improve heart disease and diabetes risk predictions

Longevity AI and researchers from Meir Medical Center of the Clalit Health Group announced a joint research collaboration to evaluate and recalibrate clinical risk prediction models for cardiovascular disease and Type 2 diabetes using longitudinal real-world data from Clalit’s integrated healthcare system. The initiative will retrain and assess globally recognized cardiovascular and Type 2 diabetes […] The post Longevity AI, Clalit collaborate to improve heart disease and diabetes risk predictions appeared first on Longevity.Technology .

[Read more](https://longevity.technology/news/longevity-ai-clalit-collaborate-to-improve-heart-disease-and-diabetes-risk-predictions/)

---

## Tags: hardware, funding

### Powerful Compute So Compact, It’s Clutch — Build AI Anywhere With NVIDIA Jetson

As a discerning AI investor who values style and substance, Sarah Guo knows this season’s standout accessory isn’t the latest designer purse — but what’s inside it. In a recent video, Guo, founder of AI-native venture capital firm Conviction and co-host of the AI podcast No Priors, highlighted how the NVIDIA Jetson platform for edge […]

[Read more](https://blogs.nvidia.com/blog/build-ai-with-nvidia-jetson/)

---


*This digest was automatically generated.*
