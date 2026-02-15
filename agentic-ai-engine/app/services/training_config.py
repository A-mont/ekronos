from __future__ import annotations
import os
from typing import Dict

TRAINING_DIRS: Dict[str, str] = {
    "smart_program": "app/services/agents/training_data/smart_program_data/services_data",
    "frontend": "agents/training_data/frontend_data",
    "server": "agents/training_data/server_data",
    "indexer": "agents/training_data/services_data",  
    "economy": "agents/training_data/economy_data",    
}

def project_root() -> str:
   
    return os.path.abspath(os.getcwd())

def get_training_dir(agent_name: str) -> str:
    rel = TRAINING_DIRS.get(agent_name)
    if not rel:
       
        return ""
    return os.path.join(project_root(), rel)
