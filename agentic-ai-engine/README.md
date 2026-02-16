# Agentic AI Engine

**Agentic AI Engine** is a modular, production-ready framework designed to build and run a **full agentic AI system** composed of specialized agents coordinated by an intelligent orchestrator.

The engine is built on **FastAPI** and designed for extensibility, observability, and real-world execution of multi-agent workflows.

---

## 🧠 Overview

This project implements an **agentic architecture** where multiple autonomous AI agents collaborate to solve complex tasks.  
Each agent has a well-defined role, while a central **Orchestrator Agent** manages coordination, routing, and decision flow.

The system is designed to be:
- Modular
- Scalable
- API-first
- Ready for real integrations (finance, development, automation)

---

## 🤖 Agent Architecture

The Agentic AI Engine includes **6 agents in total**:

### 🧮 Finance Agents (2)

These agents focus on financial reasoning, analysis, and decision-making.

1. **Finance Agent – Analysis**
   - Financial modeling
   - Cost-benefit analysis
   - Risk and sustainability reasoning

2. **Finance Agent – Execution**
   - Budget allocation logic
   - Treasury or resource planning
   - Actionable financial outputs

---

### 🛠 Development Agents (3)

These agents handle technical and software-oriented tasks.

3. **Dev Agent – Architecture**
   - System design
   - API and service decomposition
   - Technology selection reasoning

4. **Dev Agent – Implementation**
   - Code generation
   - Logic scaffolding
   - Feature implementation planning

5. **Dev Agent – QA & Optimization**
   - Code review reasoning
   - Performance and security considerations
   - Refactoring suggestions

---

### 🧭 Orchestrator Agent (1)

6. **Orchestrator Agent**
   - Routes tasks to the correct agent
   - Coordinates multi-step workflows
   - Maintains global context and state
   - Aggregates and validates agent outputs

The orchestrator is the **brain of the system**, enabling true agentic behavior instead of isolated responses.

---

## ⚙️ Tech Stack

- **Python 3.10+**
- **FastAPI** – API framework
- **Uvicorn** – ASGI server
- Modular agent architecture
- Async-ready design

---

## 1. Install dependencies

```bash
pip install -r requirements.txt
```

## 2. Run the server with Uvicorn


```bash
uvicorn app.main:app --reload
```