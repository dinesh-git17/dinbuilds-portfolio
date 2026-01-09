## Debate Lab

Debate Lab is a real-time AI debate platform that lets you watch large language models argue complex topics, challenge each other’s reasoning, and get evaluated on how well they actually made their case.

The short version: it turns AI reasoning into something you can observe instead of assume.

The longer version is that it started as an experiment in understanding how different models think when they are forced to disagree.

### What It Is

Debate Lab orchestrates live debates between multiple AI models on any topic you choose. Each model is assigned a role, follows explicit debate rules, and responds in real time. A neutral moderator enforces structure, and a judging system evaluates the quality of the arguments after the debate concludes.

It is not a chatbot playground. It is closer to a controlled experiment.

You can:
- Define a topic and debate rules
- Watch AI models argue turn by turn in real time
- See how different models reason under pressure
- Receive structured summaries, scoring, and analysis
- Export or share full debate transcripts

The goal is not to determine who is “right.” The goal is to expose how arguments are constructed.

### How It Came To Be

Debate Lab grew out of curiosity and skepticism.

As AI models became more capable, it became harder to tell whether an answer was good because it was correct or because it sounded confident. Comparing models side by side helped, but direct comparisons still felt shallow.

So instead of asking models to answer questions, I made them argue.

Forcing disagreement reveals weaknesses quickly. Logical gaps surface. Unsupported claims get challenged. Models that usually sound impressive suddenly have to defend themselves.

Debate Lab was built to make those moments visible.

### How It Works

At the core of Debate Lab is a debate engine that coordinates multiple AI providers in real time.

Each debate consists of:
- One or more debating models, each with a defined stance
- A neutral moderator that enforces rules and pacing
- A judging system that evaluates argument quality after the debate

Responses are streamed live as they are generated, not buffered and dumped at once. This allows users to watch reasoning unfold as it happens, including hesitation, revisions, and course corrections.

Behind the scenes:
- Each model is accessed through a provider abstraction layer
- Turn sequencing ensures fairness and rule compliance
- Streaming is handled through real-time event channels
- All prompts, responses, and metadata are tracked for analysis

The result is a debate that feels closer to a live exchange than a scripted demo.

### What Makes It Interesting

Debate Lab highlights differences that are easy to miss in isolation.

Some models prioritize structure and evidence.  
Some are persuasive but loose with assumptions.  
Some recover well when challenged.  
Others double down.

None of this is obvious from a single prompt.

Watching models disagree forces them to expose how they reason, not just what they know.

### Technical Overview

- Framework: Next.js with App Router
- Language: TypeScript in strict mode
- UI: React with a desktop-focused layout
- Styling: Tailwind CSS
- State Management: Zustand and TanStack Query
- Real-Time Streaming: Server-sent events and Pusher
- AI Providers: OpenAI, Anthropic, and xAI
- Testing: Vitest and Playwright
- Monitoring and Observability: Sentry with structured logging

The system was designed with performance, determinism, and security as first-class concerns. Rate limiting, content filtering, abuse tracking, and strict CSP headers are part of the baseline architecture.

### Who It Is For

Debate Lab is useful for:
- Developers comparing model behavior
- Researchers exploring reasoning differences
- Educators demonstrating argument structure
- Anyone curious about how AI systems think under constraint

It is not about declaring a winner. It is about making reasoning observable.

### Closing Note

Debate Lab reflects how I approach AI systems in general.

Confidence is cheap.  
Reasoning is not.

If a model makes a claim, it should be able to defend it.  
If it cannot, you should be able to see that too.

Debate Lab exists to make that visible.
