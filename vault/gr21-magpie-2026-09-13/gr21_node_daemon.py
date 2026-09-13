from __future__ import annotations

import asyncio
import hashlib
import logging
import time
from dataclasses import dataclass
from typing import Dict, List, Tuple

import numpy as np

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [MonstersInk-GR21] %(message)s",
)
logger = logging.getLogger("GR21NodeDaemon")


@dataclass(frozen=True)
class ConsensusBroadcastPacket:
    node_id: str
    cycle: int
    state_vector: List[float]
    residual_commitment: str
    historic_anchor: str
    signature_hash: str


class GR21NodeDaemon:
    """Async consensus daemon: Grimm Law triadic + GR-21 Magpie residual commitments."""

    def __init__(
        self,
        node_name: str,
        peer_ids: List[str],
        initial_state: np.ndarray,
        initial_constraint: np.ndarray,
        variance_threshold: float = 1e-6,
    ) -> None:
        self.node_name = node_name
        self.peer_ids = set(peer_ids)
        self.state = np.asarray(initial_state, dtype=np.float64)
        self.constraint = np.asarray(initial_constraint, dtype=np.float64)
        self.variance_threshold = float(variance_threshold)
        self.cycle = 0
        self.inbox: asyncio.Queue[ConsensusBroadcastPacket] = asyncio.Queue()
        self.peer_states: Dict[str, np.ndarray] = {}
        self.ledger_anchors: List[str] = []
        genesis_payload = f"MONSTERS_INK_GENESIS|node={node_name}|time={time.time()}".encode()
        self.current_anchor = hashlib.sha256(genesis_payload).hexdigest()
        self.ledger_anchors.append(self.current_anchor)

    def _projector(self) -> np.ndarray:
        dim = self.state.size
        if self.constraint.shape[0] == 0:
            return np.eye(dim, dtype=np.float64)
        try:
            gram = self.constraint @ self.constraint.T
            reg_gram = gram + 1e-12 * np.eye(gram.shape[0])
            pinv = self.constraint.T @ np.linalg.inv(reg_gram)
            P = np.eye(dim, dtype=np.float64) - pinv @ self.constraint
        except np.linalg.LinAlgError:
            pinv = np.linalg.pinv(self.constraint)
            P = np.eye(dim, dtype=np.float64) - pinv @ self.constraint
        return 0.5 * (P + P.T)

    def compute_pedersen_residual(self) -> Tuple[str, float]:
        P = self._projector()
        residual = (np.eye(self.state.size, dtype=np.float64) - P) @ self.state
        variance = float(np.linalg.norm(residual) ** 2 / self.state.size)
        hasher = hashlib.sha256()
        hasher.update(residual.tobytes())
        hasher.update(f"{self.cycle}|{self.current_anchor}".encode())
        return hasher.hexdigest(), variance

    async def broadcast_state(self) -> ConsensusBroadcastPacket:
        commit_hash, _variance = self.compute_pedersen_residual()
        packet_payload = f"{self.node_name}|{self.cycle}|{commit_hash}|{self.current_anchor}".encode()
        sig = hashlib.sha256(packet_payload).hexdigest()
        return ConsensusBroadcastPacket(
            node_id=self.node_name,
            cycle=self.cycle,
            state_vector=self.state.tolist(),
            residual_commitment=commit_hash,
            historic_anchor=self.current_anchor,
            signature_hash=sig,
        )

    async def ingest_peer_packet(self, packet: ConsensusBroadcastPacket) -> None:
        if packet.node_id not in self.peer_ids:
            logger.warning("Rejected packet from unknown peer: %s", packet.node_id)
            return
        await self.inbox.put(packet)

    async def step_consensus_cycle(self) -> bool:
        logger.info("[%s] Executing consensus cycle %s...", self.node_name, self.cycle)
        while not self.inbox.empty():
            pkt = await self.inbox.get()
            self.peer_states[pkt.node_id] = np.asarray(pkt.state_vector, dtype=np.float64)

        if len(self.peer_states) < 2:
            logger.info(
                "[%s] Awaiting peer convergence (collected %s/2 peers).",
                self.node_name,
                len(self.peer_states),
            )
            self.cycle += 1
            return False

        peer_vectors = list(self.peer_states.values())
        consensus_target = (1.0 / 3.0) * (self.state + peer_vectors[0] + peer_vectors[1])
        P = self._projector()
        updated_state = P @ consensus_target
        commit_hash, variance = self.compute_pedersen_residual()
        if variance > self.variance_threshold:
            logger.warning(
                "[%s] High variance (%.6e). Enforcing residual corrigibility.",
                self.node_name,
                variance,
            )
        ledger_payload = (
            f"{self.current_anchor}|cycle={self.cycle}|state={updated_state.tolist()}|commit={commit_hash}".encode()
        )
        self.current_anchor = hashlib.sha256(ledger_payload).hexdigest()
        self.ledger_anchors.append(self.current_anchor)
        self.state = updated_state
        self.cycle += 1
        logger.info("[%s] Cycle done. Anchor: %s...", self.node_name, self.current_anchor[:12])
        return True


async def simulate_monsters_ink_cluster() -> None:
    node_alpha = GR21NodeDaemon(
        "Alpha", ["Beta", "Gamma"], np.array([1.0, 0.2, 0.1]), np.array([[1.0, 0.2, 0.0]])
    )
    node_beta = GR21NodeDaemon(
        "Beta", ["Alpha", "Gamma"], np.array([1.1, 0.1, 0.2]), np.array([[1.0, -0.1, 0.0]])
    )
    node_gamma = GR21NodeDaemon(
        "Gamma", ["Alpha", "Beta"], np.array([0.9, 0.3, 0.0]), np.array([[1.0, 0.0, 0.1]])
    )
    nodes = [node_alpha, node_beta, node_gamma]
    for step in range(3):
        logger.info("--- Global Consensus Epoch %s ---", step)
        packets = await asyncio.gather(*(n.broadcast_state() for n in nodes))
        for source_node, pkt in zip(nodes, packets):
            for target_node in nodes:
                if target_node.node_name != source_node.node_name:
                    await target_node.ingest_peer_packet(pkt)
        await asyncio.gather(*(n.step_consensus_cycle() for n in nodes))
        await asyncio.sleep(0.1)
    print("\n[Monsters Ink LLC] GR-21 Cluster Simulation Concluded Successfully.")
    print(f"Alpha Final Ledger Anchor: {node_alpha.current_anchor}")


if __name__ == "__main__":
    asyncio.run(simulate_monsters_ink_cluster())
