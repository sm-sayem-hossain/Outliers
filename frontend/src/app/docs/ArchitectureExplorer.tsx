"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, FileText, Scale, Zap } from "lucide-react";
import {
  DEFAULT_ARCHITECTURE_SYSTEMS,
  ArchitectureSystem,
  ArchitectureNode,
  ExecutionStep,
  SystemMetrics,
} from "./architectureData";

const SYSTEM_ICON_MAP = {
  chat: Sparkles,
  contract: FileText,
  lawyer: Scale,
  mcp: Zap,
};

const SYSTEM_THEME_MAP = {
  chat: { color: "#d4d4d4", bg: "transparent", border: "transparent" },
  contract: { color: "#d4d4d4", bg: "transparent", border: "transparent" },
  lawyer: { color: "#d4d4d4", bg: "transparent", border: "transparent" },
  mcp: { color: "#d4d4d4", bg: "transparent", border: "transparent" },
};

interface ArchitectureExplorerProps {
  apiBase?: string;
  initialSystemId?: "chat" | "contract" | "lawyer" | "mcp";
}

export default function ArchitectureExplorer({
  apiBase = "http://127.0.0.1:8000",
  initialSystemId = "chat",
}: ArchitectureExplorerProps) {
  // Systems dataset (starts with authentic pre-compiled defaults, updates if API responds)
  const [systems, setSystems] = useState<Record<"chat" | "contract" | "lawyer" | "mcp", ArchitectureSystem>>(
    DEFAULT_ARCHITECTURE_SYSTEMS
  );
  const [activeSystemId, setActiveSystemId] = useState<"chat" | "contract" | "lawyer" | "mcp">(initialSystemId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [copiedEndpoint, setCopiedEndpoint] = useState<boolean>(false);
  const animateFlow = true;

  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync with live backend architecture API if reachable
  useEffect(() => {
    fetch(`${apiBase}/api/docs/architecture`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Architecture API offline");
      })
      .then((payload) => {
        if (payload && payload.systems) {
          setSystems((prev) => ({
            ...prev,
            ...payload.systems,
          }));
        }
      })
      .catch(() => {
        // Gracefully stay on authentic verified local dataset
      });
  }, [apiBase]);

  const activeSystem = systems[activeSystemId] || DEFAULT_ARCHITECTURE_SYSTEMS[activeSystemId];

  // Handle system switch
  const handleSystemChange = (sysId: "chat" | "contract" | "lawyer" | "mcp") => {
    setActiveSystemId(sysId);
    setSelectedNodeId(null);
    setHoveredNodeId(null);
  };

  // Copy endpoint utility
  const copyEndpoint = (endpoint: string) => {
    navigator.clipboard.writeText(endpoint);
    setCopiedEndpoint(true);
    setTimeout(() => setCopiedEndpoint(false), 2000);
  };

  return (
    <div ref={containerRef} className="arch-master-wrapper">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. SYSTEM SELECTOR BAR (Hearth-styled Pills)              */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="arch-flow-selector-bar">
        <div className="arch-selector-headline">
          <span className="arch-selector-prefix">ARCHITECTURE EXPLORER:</span>
          <span className="arch-selector-subtitle">Select a core subsystem to inspect real backend execution</span>
        </div>
        <div className="arch-flow-pills">
          {(["chat", "contract", "lawyer", "mcp"] as const).map((id) => {
            const sys = systems[id];
            const isActive = activeSystemId === id;
            const Icon = SYSTEM_ICON_MAP[id];
            const theme = SYSTEM_THEME_MAP[id];

            return (
              <button
                key={id}
                type="button"
                className={`arch-flow-pill${isActive ? " active" : ""}`}
                onClick={() => handleSystemChange(id)}
              >
                <div
                  className="pill-icon-badge"
                  style={{
                    backgroundColor: theme.bg,
                    color: theme.color,
                    borderColor: theme.border,
                  }}
                >
                  <Icon size={19} strokeWidth={2.3} />
                </div>
                <div className="pill-title-wrap">
                  <span className="pill-title">{sys.short_title}</span>
                </div>
                <span className="pill-version">{sys.version}</span>
                {isActive && <span className="pill-live-dot" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. SYSTEM TELEMETRY & VERIFIED TECHNICAL INSIGHTS STRIP    */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="arch-telemetry-card">
        <div className="arch-telemetry-header">
          <div className="arch-telemetry-left">
            <h3 className="arch-system-title">
              <span
                className="title-icon-badge"
                style={{
                  color: SYSTEM_THEME_MAP[activeSystemId].color,
                  backgroundColor: SYSTEM_THEME_MAP[activeSystemId].bg,
                  borderColor: SYSTEM_THEME_MAP[activeSystemId].border,
                }}
              >
                {React.createElement(SYSTEM_ICON_MAP[activeSystemId], { size: 20, strokeWidth: 2.3 })}
              </span>
              {activeSystem.title}
            </h3>
            <p className="arch-system-tagline">{activeSystem.tagline}</p>
          </div>

          <div className="arch-telemetry-right">
            <div className="arch-endpoint-box">
              <span className="arch-endpoint-label">API ROUTE:</span>
              <code className="arch-endpoint-code">{activeSystem.endpoint}</code>
              <button
                type="button"
                className="arch-copy-btn"
                onClick={() => copyEndpoint(activeSystem.endpoint)}
                title="Copy API Route"
              >
                {copiedEndpoint ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* 4 Technical KPI Insight Tiles */}
        <div className="arch-metric-tiles-grid">
          <div className="arch-metric-tile">
            <span className="tile-label">EXECUTION LATENCY</span>
            <span className="tile-value">{activeSystem.metrics.latency}</span>
            <span className="tile-hint">Sovereign Async Engine</span>
          </div>
          <div className="arch-metric-tile">
            <span className="tile-label">VERIFIED CORPUS</span>
            <span className="tile-value">{activeSystem.metrics.corpus_size}</span>
            <span className="tile-hint">Bangladesh Gazette Index</span>
          </div>
          <div className="arch-metric-tile">
            <span className="tile-label">PRIMARY INFERENCE</span>
            <span className="tile-value">{activeSystem.metrics.primary_model}</span>
            <span className="tile-hint">Fallback: {activeSystem.metrics.fallback_model}</span>
          </div>
          <div className="arch-metric-tile">
            <span className="tile-label">VERIFICATION METHOD</span>
            <span className="tile-value highlight">{activeSystem.metrics.verification_method}</span>
            <span className="tile-hint">{activeSystem.metrics.accuracy_score}</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. DYNAMIC INTERACTIVE SVG CANVAS                          */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="svg-canvas-container" style={{ width: "100%", overflow: "hidden" }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 1060 ${Math.ceil(activeSystem.nodes.length / 2) * 260 + 74}`}
          className="arch-svg-canvas"
          style={{ width: "100%", height: "auto", display: "block" }}
          preserveAspectRatio="xMidYMid meet"
        >
            <defs>
              {/* Arrow Marker: Primary Terracotta */}
              <marker
                id="arch-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#d4d4d4" />
              </marker>

              {/* Arrow Marker: Emerald Return Stream */}
              <marker
                id="arch-return-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#d4d4d4" />
              </marker>

              {/* Arrow Marker: Fallback/Tool Gold */}
              <marker
                id="arch-tool-arrow"
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="#8a8a8a" />
              </marker>

              {/* Node Card Gradient */}
              <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1f2937" />
                <stop offset="100%" stopColor="#0e0e0e" />
              </linearGradient>

              {/* Selected Node Glow */}
              <filter id="nodeGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#d4d4d4" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* ── RENDER SYSTEM TOPOLOGY (readable snake grid) ── */}
            {renderTopology(activeSystemId, {
              nodes: activeSystem.nodes,
              selectedNodeId,
              hoveredNodeId,
              animateFlow,
              onSelectNode: setSelectedNodeId,
              onHoverNode: setHoveredNodeId,
            })}
          </svg>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 5. SCOPED STYLES (Preserving Hearth Theme Design Tokens)   */}
      {/* ────────────────────────────────────────────────────────── */}
      <style jsx>{`
        .arch-master-wrapper {
          margin-top: 1.5rem;
          margin-bottom: 2.5rem;
          border: 1px solid #2e2e2e;
          border-radius: 12px;
          background: #0e0e0e;
          box-shadow: none;
          overflow: hidden;
          font-family: inherit;
        }

        /* 1. Selector Bar */
        .arch-flow-selector-bar {
          background: #0e0e0e;
          border-bottom: 1px solid #0e0e0e;
          padding: 1.25rem 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .arch-selector-headline {
          display: flex;
          align-items: baseline;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .arch-selector-prefix {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #d4d4d4;
          text-transform: uppercase;
        }
        .arch-selector-subtitle {
          font-size: 0.88rem;
          color: #8a8a8a;
        }
        .arch-flow-pills {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.85rem;
        }
        @media (max-width: 900px) {
          .arch-flow-pills {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 520px) {
          .arch-flow-pills {
            grid-template-columns: 1fr;
          }
        }
        .arch-flow-pill {
          background: #0e0e0e;
          border: 1.5px solid #333333;
          border-radius: 0;
          padding: 0.9rem 1.1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          font-family: inherit;
          text-align: left;
          position: relative;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .arch-flow-pill:hover {
          border-color: #d4d4d4;
          background: #0e0e0e;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.5);
        }
        .arch-flow-pill.active {
          background: #0e0e0e;
          border-color: #d4d4d4;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.12), 0 2px 4px rgba(0, 0, 0, 0.4);
        }
        .pill-icon-badge {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .arch-flow-pill:hover .pill-icon-badge {
          transform: scale(1.08);
        }
        .pill-title-wrap {
          flex-grow: 1;
          min-width: 0;
        }
        .pill-title {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 0.96rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
          letter-spacing: -0.01em;
          display: block;
        }
        .arch-flow-pill.active .pill-title {
          color: #d4d4d4;
        }
        .pill-version {
          font-size: 0.68rem;
          font-family: monospace;
          background: #0e0e0e;
          padding: 0.2rem 0.5rem;
          border-radius: 5px;
          color: #a3a3a3;
          font-weight: 700;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .pill-live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #d4d4d4;
          box-shadow: none;
          position: absolute;
          top: 9px;
          right: 9px;
        }
        .title-icon-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 34px;
          height: 34px;
          border-radius: 0;
          border: 1px solid transparent;
          margin-right: 0.6rem;
          vertical-align: middle;
        }

        /* 2. Telemetry Card */
        .arch-telemetry-card {
          padding: 1.5rem 1.75rem;
          background: #0e0e0e;
          border-bottom: 1px solid #0e0e0e;
        }
        .arch-telemetry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.25rem;
        }
        .arch-telemetry-tags {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .arch-pill-tag {
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          padding: 0.2rem 0.6rem;
          border-radius: 4px;
        }
        .arch-pill-tag.brand {
          background: rgba(255, 255, 255, 0.1);
          color: #d4d4d4;
        }
        .arch-pill-tag.pattern {
          background: #0e0e0e;
          color: #a3a3a3;
        }
        .arch-system-title {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 1.4rem;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          font-weight: 700;
        }
        .arch-system-tagline {
          font-size: 0.9rem;
          color: #a3a3a3;
          margin: 0;
          max-width: 650px;
          line-height: 1.45;
        }
        .arch-endpoint-box {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          padding: 0.5rem 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .arch-endpoint-label {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #8a8a8a;
        }
        .arch-endpoint-code {
          font-family: monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: #d4d4d4;
        }
        .arch-copy-btn {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          padding: 0.2rem 0.55rem;
          border-radius: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
        }
        .arch-copy-btn:hover {
          border-color: #d4d4d4;
          color: #d4d4d4;
        }

        .arch-metric-tiles-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-top: 1rem;
        }
        @media (max-width: 860px) {
          .arch-metric-tiles-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 500px) {
          .arch-metric-tiles-grid {
            grid-template-columns: 1fr;
          }
        }
        .arch-metric-tile {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 0;
          padding: 0.85rem 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .tile-label {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #8a8a8a;
        }
        .tile-value {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.25;
        }
        .tile-value.highlight {
          color: #ffffff;
          font-size: 1rem;
        }
        .tile-hint {
          font-size: 0.72rem;
          color: #8a8a8a;
        }

        /* 3. Canvas Toolbar */
        .arch-canvas-toolbar {
          background: #0e0e0e;
          border-bottom: 1px solid #0e0e0e;
          padding: 0.75rem 1.75rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.75rem;
        }
        .toolbar-left {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }
        .canvas-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #ffffff;
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          padding: 0.25rem 0.6rem;
          border-radius: 50px;
        }
        .pulse-indicator {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #d4d4d4;
          box-shadow: none;
        }
        .canvas-help-text {
          font-size: 0.78rem;
          color: #8a8a8a;
          font-style: italic;
        }
        .toolbar-actions {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          flex-wrap: wrap;
        }
        .zoom-btn-group {
          display: flex;
          align-items: center;
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          overflow: hidden;
        }
        .tb-btn {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          padding: 0.35rem 0.75rem;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s ease;
        }
        .zoom-btn-group .tb-btn {
          border: none;
          border-radius: 0;
          padding: 0.35rem 0.6rem;
        }
        .zoom-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #a3a3a3;
          padding: 0 0.4rem;
          min-width: 44px;
          text-align: center;
        }
        .tb-btn:hover {
          background: #0e0e0e;
          border-color: #d4d4d4;
          color: #d4d4d4;
        }
        .tb-btn.toggle-btn.active {
          background: rgba(255, 255, 255, 0.1);
          color: #d4d4d4;
          border-color: #d4d4d4;
        }
        .tb-btn.small {
          padding: 0.25rem 0.55rem;
          font-size: 0.7rem;
        }

        /* 4. Canvas Container */
        .svg-canvas-container {
          background: #0e0e0e;
          padding: 1.25rem 1.5rem;
          position: relative;
          width: 100%;
          overflow-x: auto;
          overflow-y: hidden;
          -webkit-overflow-scrolling: touch;
        }
        .svg-zoom-wrapper {
          width: 100%;
          max-width: 100%;
        }
        .arch-svg-canvas {
          background: transparent;
          width: 100%;
          min-width: 860px;
          height: auto;
          display: block;
        }

        /* 5. Node Inspector */
        .arch-node-inspector-card {
          margin: 1.5rem 1.75rem;
          background: #0e0e0e;
          border: 1px solid #d4d4d4;
          border-radius: 0;
          padding: 1.5rem;
          box-shadow: 0 6px 20px rgba(255, 255, 255, 0.08);
          animation: slideDown 0.25s ease-out;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .inspector-head {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.85rem;
        }
        .inspector-title-group {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .inspector-layer-pill {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #0e0e0e;
          color: #d4d4d4;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .inspector-name {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 1.25rem;
          color: #ffffff;
          margin: 0;
          font-weight: 700;
        }
        .status-badge {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        .status-badge.live {
          background: rgba(74, 222, 128, 0.1);
          color: rgba(74, 222, 128, 0.7);
        }
        .status-badge.beta {
          background: rgba(251, 191, 36, 0.1);
          color: rgba(251, 191, 36, 0.7);
        }
        .inspector-close-btn {
          background: none;
          border: 1px solid #2e2e2e;
          border-radius: 4px;
          padding: 0.25rem 0.65rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: #8a8a8a;
          cursor: pointer;
        }
        .inspector-close-btn:hover {
          color: #d4d4d4;
          border-color: #d4d4d4;
        }
        .inspector-desc {
          font-size: 0.92rem;
          color: #a3a3a3;
          line-height: 1.5;
          margin: 0 0 1.25rem 0;
        }
        .inspector-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.25rem;
        }
        @media (max-width: 768px) {
          .inspector-grid {
            grid-template-columns: 1fr;
          }
        }
        .inspector-box {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 0;
          padding: 0.85rem 1rem;
        }
        .box-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #d4d4d4;
          text-transform: uppercase;
          display: block;
          margin-bottom: 0.4rem;
        }
        .box-text {
          font-size: 0.85rem;
          color: #ffffff;
          margin: 0;
          line-height: 1.45;
        }
        .box-text.code-val {
          font-family: monospace;
          color: #1b2430;
          font-weight: 600;
        }
        .box-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .box-list li {
          font-size: 0.82rem;
          color: #a3a3a3;
          display: flex;
          gap: 0.4rem;
        }
        .box-list li::before {
          content: "•";
          color: #d4d4d4;
        }
        .inspector-footer {
          border-top: 1px dashed #0e0e0e;
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .service-ref {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .ref-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #8a8a8a;
        }
        .ref-path {
          font-family: monospace;
          font-size: 0.82rem;
          color: #d4d4d4;
          font-weight: 700;
          background: #0e0e0e;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .snippet-wrap {
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          overflow: hidden;
        }
        .snippet-bar {
          background: #0e0e0e;
          padding: 0.4rem 0.85rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .snippet-title {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #8a8a8a;
          text-transform: uppercase;
        }
        .snippet-copy-btn {
          background: rgba(255, 255, 255, 0.15);
          border: none;
          color: #ffffff;
          padding: 0.2rem 0.5rem;
          border-radius: 3px;
          font-size: 0.7rem;
          cursor: pointer;
        }
        .snippet-copy-btn:hover {
          background: #d4d4d4;
        }
        .arch-code-block {
          background: #1a1a1a;
          color: #d4d4d4;
          padding: 0.85rem 1rem;
          margin: 0;
          font-family: monospace;
          font-size: 0.8rem;
          line-height: 1.5;
          overflow-x: auto;
        }

        /* 6. Execution Timeline */
        .arch-timeline-container {
          padding: 1.75rem;
          background: #0e0e0e;
          border-top: 1px solid #0e0e0e;
        }
        .timeline-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1.5rem;
          flex-wrap: wrap;
          margin-bottom: 1.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid #0e0e0e;
        }
        .timeline-section-title {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 1.3rem;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          font-weight: 700;
        }
        .timeline-section-sub {
          font-size: 0.88rem;
          color: #8a8a8a;
          margin: 0;
        }
        .timeline-header-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .step-stepper {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 6px;
          padding: 0.2rem 0.4rem;
        }
        .step-nav-btn {
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          padding: 0.25rem 0.6rem;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #ffffff;
          cursor: pointer;
        }
        .step-nav-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .step-stepper-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: #a3a3a3;
          padding: 0 0.4rem;
        }
        .timeline-track {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .timeline-step-card {
          display: flex;
          gap: 1.25rem;
          background: #0e0e0e;
          border: 1px solid #2e2e2e;
          border-radius: 0;
          padding: 1rem 1.4rem;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .timeline-step-card:hover {
          border-color: #d4d4d4;
          box-shadow: 0 4px 14px rgba(255, 255, 255, 0.06);
          background: #0e0e0e;
        }
        .timeline-step-card.active {
          border-color: #d4d4d4;
          box-shadow: 0 4px 16px rgba(255, 255, 255, 0.12);
          background: #0e0e0e;
        }
        .timeline-guide-rail {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 32px;
          flex-shrink: 0;
        }
        .timeline-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: #0e0e0e;
          color: #a3a3a3;
          font-size: 0.75rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .timeline-dot.active-dot {
          background: #d4d4d4;
          color: #0e0e0e;
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2);
        }
        .timeline-line {
          width: 2px;
          flex-grow: 1;
          background: #0e0e0e;
          margin-top: 0.4rem;
        }
        .timeline-body-wrap {
          flex-grow: 1;
        }
        .timeline-step-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          user-select: none;
        }
        .step-tags-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.35rem;
          flex-wrap: wrap;
        }
        .step-stage-tag {
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.1);
          color: #d4d4d4;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .step-component-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: #1b2430;
          background: #151a22;
          padding: 0.15rem 0.5rem;
          border-radius: 4px;
        }
        .step-module-tag {
          font-family: monospace;
          font-size: 0.72rem;
          color: #8a8a8a;
        }
        .step-operation-title {
          font-family: var(--font-fraunces), sans-serif;
          font-size: 1.08rem;
          color: #ffffff;
          margin: 0 0 0.35rem 0;
          font-weight: 700;
          line-height: 1.35;
        }
        .step-main-work {
          font-size: 0.85rem;
          color: #a3a3a3;
          margin: 0 0 0.35rem 0;
          line-height: 1.45;
        }
        .main-work-label {
          font-weight: 700;
          color: #ffffff;
        }
        .step-guard-line {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #0e0e0e;
          border-left: 3px solid #2e2e2e;
          padding: 0.35rem 0.65rem;
          border-radius: 0 4px 4px 0;
          margin-top: 0.3rem;
        }
        .guard-shield-badge {
          font-size: 0.68rem;
          font-weight: 800;
          color: #a3a3a3;
          white-space: nowrap;
        }
        .guard-desc-text {
          font-size: 0.78rem;
          color: #8a8a8a;
          line-height: 1.35;
        }
      `}</style>
    </div>
  );
}

// =========================================================================
// 🏛 SVG TOPOLOGY SUB-COMPONENTS (With Dynamic Flow Dashes & Interactive Nodes)
// =========================================================================

interface TopologyProps {
  nodes: ArchitectureNode[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  animateFlow: boolean;
  onSelectNode: (id: string) => void;
  onHoverNode: (id: string | null) => void;
}

// ── 1. BILINGUAL COPILOT CHAT TOPOLOGY (6 Nodes) ──
// ── SHARED SNAKE-GRID TOPOLOGY (readable, mobile-scrollable) ──
interface TopologyData {
  nodes: ArchitectureNode[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  animateFlow: boolean;
  onSelectNode: (id: string) => void;
  onHoverNode: (id: string | null) => void;
  connectorLabels: string[];
  returnTitle: string;
  returnSub: string;
}

function TopologyGrid({
  nodes,
  selectedNodeId,
  hoveredNodeId,
  animateFlow,
  onSelectNode,
  onHoverNode,
  connectorLabels,
  returnTitle,
  returnSub,
}: TopologyData) {
  const perRow = 2;
  const nodeWidth = 460;
  const nodeHeight = 190;
  const gapX = 40;
  const gapY = 70;
  const startX = 30;
  const startY = 34;
  const rows = Math.ceil(nodes.length / perRow);
  const rowY = (r: number) => startY + r * (nodeHeight + gapY);
  const lastBottom = rowY(rows - 1) + nodeHeight;
  const badgeY = lastBottom + 40;
  const badgeW = 960;
  const badgeX = startX;

  // Snake positions: even rows L->R, odd rows R->L
  const positions = nodes.map((_, idx) => {
    const r = Math.floor(idx / perRow);
    const c = idx % perRow;
    const col = r % 2 === 0 ? c : perRow - 1 - c;
    return { x: startX + col * (nodeWidth + gapX), y: rowY(r), r, col };
  });

  const midOf = (idx: number) => positions[idx].y + nodeHeight / 2;

  return (
    <g>
      {/* Return stream badge */}
      <g transform={`translate(${badgeX}, ${badgeY})`}>
        <rect width={badgeW} height="46" rx="0" fill="#0e0e0e" stroke="#2e2e2e" strokeWidth="1.2" />
        <text x={badgeW / 2} y="19" textAnchor="middle" fill="#d4d4d4" fontSize="12.5" fontWeight="800">
          {returnTitle}
        </text>
        <text x={badgeW / 2} y="35" textAnchor="middle" fill="#8a8a8a" fontSize="10.5">
          {returnSub}
        </text>
      </g>


      {nodes.map((node, idx) => {
        const pos = positions[idx];
        return (
          <SvgNodeCard
            key={node.id}
            node={node}
            idx={idx}
            x={pos.x}
            y={pos.y}
            width={nodeWidth}
            height={nodeHeight}
            isSelected={selectedNodeId === node.id}
            isHovered={hoveredNodeId === node.id}
            accentColor="#d4d4d4"
            onClick={() => onSelectNode(node.id)}
            onMouseEnter={() => onHoverNode(node.id)}
            onMouseLeave={() => onHoverNode(null)}
          />
        );
      })}

      {/* Connectors in flow order */}
      {nodes.slice(0, -1).map((_, idx) => {
        const a = positions[idx];
        const b = positions[idx + 1];
        const label = connectorLabels[idx] || "";
        let d = "";
        let lx = 0;
        let ly = 0;
        if (a.r === b.r) {
          // horizontal within row
          if (b.x > a.x) {
            d = `M ${a.x + nodeWidth} ${midOf(idx)} L ${b.x - 4} ${midOf(idx)}`;
            lx = (a.x + nodeWidth + b.x) / 2;
          } else {
            d = `M ${a.x} ${midOf(idx)} L ${b.x + nodeWidth + 4} ${midOf(idx)}`;
            lx = (a.x + b.x + nodeWidth) / 2;
          }
          ly = midOf(idx) - 12;
        } else {
          // vertical drop between rows
          const cx = a.x + nodeWidth / 2;
          d = `M ${cx} ${a.y + nodeHeight} L ${cx} ${b.y - 6}`;
          lx = cx + 14;
          ly = (a.y + nodeHeight + b.y) / 2 + 4;
        }
        const showLabel = a.r !== b.r;
        return (
          <g key={idx}>
            <path
              d={d}
              stroke="#d4d4d4"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arch-arrow)"
              strokeDasharray={animateFlow ? "6 3" : "none"}
              className={animateFlow ? "arch-flowing-path" : ""}
            />
            {showLabel && (
              <text x={lx} y={ly} textAnchor="start" fill="#8a8a8a" fontSize="11.5" fontWeight="700">
                {label}
              </text>
            )}
          </g>
        );
      })}

    </g>
  );
}

// ── TOPOLOGY FLOW DATA (connector labels + return stream copy) ──
const TOPOLOGY_FLOWS = {
  chat: {
    connectorLabels: ["HTTPS / POST", "qa_graph.ainvoke", "hybrid_retriever", "Groq LLaMA 70B", "Gazette Verify"],
    returnTitle: "RETURN STREAM: Verified Statutory Citations & Gazette Links via SSE Token Stream",
    returnSub: "100% Anti-Hallucination Grounding • Precedents from bdlaws.minlaw.gov.bd",
  },
  contract: {
    connectorLabels: ["Upload Stream", "AST Parsing", "Missing Checks", "LLaMA 70B Scorer", "Statutory Match", "DOCX Memo Stream"],
    returnTitle: "RETURN STREAM: 30-Second Audit Memo · Severity Ranked Findings · DOCX Redlines",
    returnSub: "Executive Health Score (0-100) • Mandatory Statutory Compliance Validation",
  },
  lawyer: {
    connectorLabels: ["POST /inquiries", "rank_lawyers", "3-Hour Dispatch", "Bar Seal & Sign"],
    returnTitle: "RETURN STREAM: Verified Countersigned Legal Memo & Official Bar Seal",
    returnSub: "Tamper-Proof Audit Trail • Instant Fee Disbursement to Advocate",
  },
  mcp: {
    connectorLabels: ["JSON-RPC 2.0", "search_statutes", "check_act_status", "search_case_law", "Proxy-Safe POST"],
    returnTitle: "RETURN STREAM: Proxy-Safe Inline JSON-RPC 2.0 Response · Sub-280ms Latency · Zero SSE Drops",
    returnSub: "8 Production Legal Tools • 2 Dynamic Resources (legal://) • 2 Research Prompt Templates",
  },
};

function renderTopology(
  activeSystemId: string,
  props: Omit<TopologyData, "connectorLabels" | "returnTitle" | "returnSub">
) {
  const flow = TOPOLOGY_FLOWS[activeSystemId as keyof typeof TOPOLOGY_FLOWS];
  return <TopologyGrid {...props} connectorLabels={flow.connectorLabels} returnTitle={flow.returnTitle} returnSub={flow.returnSub} />;
}

// ── CLEAN BULLET RETRIEVER HELPER ──
function getNodeBullets(node: ArchitectureNode): string[] {
  const map: Record<string, string[]> = {
    // Chat Flow
    chat_ui: ["Client Sovereign PII", "Live SSE Token Stream", "Zero Raw Transit"],
    chat_gateway: ["Token Version Auth Guard", "Atomic Credit Ledger", "BOLA Security Layer"],
    chat_router: ["Intent Classification", "StateGraph Machine", "Art. 33 Safeguards"],
    chat_retriever: ["3,547 Act Aliases", "Qdrant Hybrid Vectors", "Cosine Filter >= 0.78"],
    chat_generator: ["Groq LLaMA 3.3 70B", "Grounded Reasoning", "Context-Only Synthesis"],
    chat_verifier: ["Official Gazette Check", "BDlaws Authentic URLs", "Zero Hallucination"],

    // Contract Audit
    contract_upload: ["Client Sovereignty", "Zero Raw Ingestion", "SHA-256 Checksum"],
    contract_extract: ["PDF/DOCX AST Parsing", "Structural Hierarchy", "Table Matrix Parser"],
    contract_classify: ["Clause Classification", "Missing Terms Alert", "Standard Playbook"],
    contract_risk: ["LLaMA 70B Risk Scorer", "Severity Ranking", "Exposure Analysis"],
    contract_statute: ["Bangla Statute Match", "Section Verification", "Statutory Checks"],
    contract_grounding: ["Clause Pinpointer", "Citation Validation", "Confidence Scoring"],
    contract_export: ["Executive Audit Memo", "DOCX Redlines Stream", "Client PDF Delivery"],

    // Lawyer HITL
    lawyer_trigger: ["Risk Threshold Alert", "Client Escrow Deposit", "Instant Dispatch"],
    lawyer_matcher: ["Supreme Court Filter", "Specialty Routing", "3-Hour Timed Dispatch"],
    lawyer_portal: ["Secure Sandbox Portal", "Dual Redline View", "Client Messaging"],
    lawyer_sign: ["Digital Bar Seal", "Bangladesh Bar Sanction", "Signed Legal Memo"],
    lawyer_audit: ["Tamper-Proof Audit", "SSLCommerz Payout", "Completed Delivery"],

    // MCP Tools & Search (Updated directly from Bangladesh-Legal-MCP Server)
    mcp_client: ["Cursor IDE & Claude", "FastMCP Protocol Client", "Sub-second Tool Calls"],
    mcp_gateway: ["DNS Rebinding Shield", "Allowed Hosts Filter", "Stateless HTTP Transport"],
    mcp_statute: ["35K+ Sections (e5-small)", "Verbatim Section Scroll", "Act Table of Contents"],
    mcp_shield: ["[রহিত] Repeal Detector", "Replacement Chain Map", "0% Phantom Citations"],
    mcp_case_law: ["Supreme Court Verdicts", "10 Legal Topic Vectors", "Tier 1 Domain Filter"],
    mcp_delivery: ["Self-Contained POST Body", "Zero SSE Proxy Buffering", "Render-to-Render Safe"],
  };

  if (map[node.id]) return map[node.id];
  return [
    node.role.slice(0, 22),
    (node.inputs[0] || "Standard Input").slice(0, 22),
    (node.outputs[0] || "Verified Output").slice(0, 22),
  ];
}

// ── SVG NODE CARD COMPONENT ──
interface SvgNodeCardProps {
  node: ArchitectureNode;
  idx: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isSelected: boolean;
  isHovered: boolean;
  accentColor: string;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

function SvgNodeCard({
  node,
  idx,
  x,
  y,
  width,
  height,
  isSelected,
  isHovered,
  accentColor,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: SvgNodeCardProps) {
  const isHighlighted = isSelected || isHovered;
  const bullets = getNodeBullets(node);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ cursor: "pointer", transition: "transform 0.15s ease" }}
      filter={isHighlighted ? "url(#nodeGlow)" : undefined}
    >
      {/* Background card */}
      <rect
        width={width}
        height={height}
        rx="0"
        fill="#141414"
        stroke={isSelected ? "#ffffff" : isHovered ? "#d4d4d4" : "#2e2e2e"}
        strokeWidth={isSelected ? "2" : isHovered ? "1.5" : "1"}
      />

      {/* Big phase number */}
      <text x="18" y="44" fill="#333333" fontSize="30" fontWeight="800">
        {String(idx + 1).padStart(2, "0")}
      </text>

      {/* Layer name */}
      <text x="72" y="28" fill="#8a8a8a" fontSize="10.5" fontWeight="800" letterSpacing="0.14em">
        {node.layer.replace(/^\d+\.\s*/, "").toUpperCase()}
      </text>

      {/* Component title */}
      <text x="72" y="50" fill="#ffffff" fontSize="17" fontWeight="700">
        {node.label.length > 30 ? node.label.slice(0, 28) + "…" : node.label}
      </text>

      {/* Tech stack — one small mono line */}
      <text x="18" y="82" fill="#8a8a8a" fontSize="10.5" fontFamily="monospace">
        {node.tech.length > 52 ? node.tech.slice(0, 50) + "…" : node.tech}
      </text>

      <line x1="18" y1="100" x2={width - 18} y2="100" stroke="#2e2e2e" strokeWidth="1" />

      {/* Role bullets — plain dashes */}
      {bullets.slice(0, 3).map((b, i) => (
        <text key={i} x="18" y={124 + i * 21} fill="#a3a3a3" fontSize="11.5" fontWeight="500">
          — {b.length > 44 ? b.slice(0, 42) + "…" : b}
        </text>
      ))}

      {/* Selected marker only */}
      {isSelected && (
        <text x={width - 18} y="44" textAnchor="end" fill="#ffffff" fontSize="10.5" fontWeight="800" letterSpacing="0.1em">
          ● ACTIVE
        </text>
      )}
    </g>
  );
}
