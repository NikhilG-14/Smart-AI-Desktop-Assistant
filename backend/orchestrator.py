import logging
from typing import Dict, Any

from backend.agents.base_agent import BaseAgent
from backend.agents.system_agent import SystemAgent
from backend.agents.web_agent import WebAgent
from backend.agents.app_agent import AppAgent
from backend.agents.data_agent import DataAgent

logger = logging.getLogger(__name__)


class AgentOrchestrator:
    """
    Receives a routing decision from DecisionEngine and dispatches
    it to the appropriate specialist agent.
    """

    def __init__(self):
        self.agents: Dict[str, BaseAgent] = {
            "system": SystemAgent(),
            "web":    WebAgent(),
            "app":    AppAgent(),
            "data":   DataAgent(),
        }

    def route(self, decision: Dict[str, Any]):
        """Dispatch the decision to the correct agent and yield its response chunks."""

        # Handle clarification first
        if decision.get("needs_clarification"):
            yield decision.get("clarification_question") or "Could you please clarify?"
            return

        agent_name = decision.get("agent", "data")
        intent     = decision.get("intent", "general_query")
        slots      = decision.get("slots", {})

        agent = self.agents.get(agent_name)
        if agent is None:
            logger.warning(f"[Orchestrator] Unknown agent '{agent_name}', falling back to data")
            agent = self.agents["data"]

        # If agent can't handle this specific intent, try data as fallback
        if not agent.can_handle(intent):
            logger.warning(
                f"[Orchestrator] Agent '{agent_name}' cannot handle intent '{intent}'"
                " — falling back to data/general_query"
            )
            agent  = self.agents["data"]
            intent = "general_query"
            slots  = {"query": str(slots)}

        try:
            logger.info(f"[Orchestrator] Routing intent='{intent}' → agent='{agent.name}'")
            result = agent.execute(intent, slots)
            
            # Agents can return a string or a generator
            if isinstance(result, str):
                yield result
            else:
                for chunk in result:
                    yield chunk
        except Exception as e:
            logger.error(f"[Orchestrator] Agent execution failed: {e}", exc_info=True)
            yield f"Sorry, I encountered an error: {e}"
