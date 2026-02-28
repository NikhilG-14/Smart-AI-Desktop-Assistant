from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseAgent(ABC):
    """Abstract base class for all agents in the multi-agent system."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def can_handle(self, intent: str) -> bool:
        """Return True if this agent is capable of handling the given intent."""
        pass

    @abstractmethod
    def execute(self, intent: str, slots: Dict[str, Any]) -> str:
        """Execute the intent with the provided slots and return a text response."""
        pass

    def __repr__(self) -> str:
        return f"<Agent: {self.name}>"
