/**
 * MCP Server Unit Tests
 *
 * The server module runs top-level code (DB setup, server.connect) so we
 * mock all heavy dependencies before importing.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const sessionStateManager = vi.hoisted(() => ({
  initializeSessionSchema: vi.fn(),
  getLatestSession: vi.fn(),
  saveSession: vi.fn(),
  listSessions: vi.fn(),
}));

vi.mock("../../src/mcp/state-manager.mts", () => ({
  ...sessionStateManager,
}));

// --- Mock db-loader (wraps better-sqlite3 with createRequire fallback) ---
const mockExec = vi.fn();
const mockPragma = vi.fn();
const mockDbInstance = { exec: mockExec, pragma: mockPragma };
vi.mock("../../src/mcp/db-loader.mts", () => ({
  SqliteConstructor: vi.fn(() => mockDbInstance),
}));

// --- Mock fs ---
vi.mock("fs", () => ({
  readFileSync: vi.fn(() => { throw new Error("no hud file"); }),
  mkdirSync: vi.fn(),
}));

// --- Mock os ---
vi.mock("os", () => ({
  homedir: () => "/mock-home",
}));

// --- Capture handlers registered during module load ---
// We need to collect them before any clearAllMocks() runs.
const registeredHandlers = new Map<string, Function>();
const mockSetRequestHandler = vi.fn((schema: string, fn: Function) => {
  registeredHandlers.set(schema, fn);
});
const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock("@modelcontextprotocol/sdk/server/index.js", () => ({
  Server: vi.fn(() => ({
    setRequestHandler: mockSetRequestHandler,
    connect: mockConnect,
  })),
}));

vi.mock("@modelcontextprotocol/sdk/server/stdio.js", () => ({
  StdioServerTransport: vi.fn(() => ({})),
}));

vi.mock("@modelcontextprotocol/sdk/types.js", () => ({
  CallToolRequestSchema: "CallToolRequestSchema",
  ListToolsRequestSchema: "ListToolsRequestSchema",
}));

// --- Mock agent-loader (dynamic import inside handlers) ---
vi.mock("../../src/utils/agent-loader.mts", () => ({
  loadAllAgents: vi.fn(() =>
    new Map([
      ["executor", { id: "executor", modelTier: "standard", description: "Executes tasks", tools: ["bash"] }],
      ["explore", { id: "explore", modelTier: "fast", description: "Explores codebase", tools: ["glob"] }],
    ])
  ),
}));

// Import server module — runs top-level code, registers handlers, connects
await import("../../src/mcp/server.mts");

// Capture call counts before any test can clear them
const initialSetRequestHandlerCalls = mockSetRequestHandler.mock.calls.slice();
const wasConnectCalled = mockConnect.mock.calls.length > 0;
const initialSessionSchemaCalls = sessionStateManager.initializeSessionSchema.mock.calls.slice();

describe("MCP Server", () => {
  beforeEach(() => {
    // Only clear the db method mocks between tests, not the handler registry
    sessionStateManager.getLatestSession.mockReset();
    sessionStateManager.getLatestSession.mockReturnValue(null);
    sessionStateManager.saveSession.mockReset();
    sessionStateManager.listSessions.mockReset();
    sessionStateManager.listSessions.mockReturnValue([]);
  });

  describe("server startup", () => {
    it("should register ListTools handler", () => {
      const registered = initialSetRequestHandlerCalls.some(
        ([schema]) => schema === "ListToolsRequestSchema"
      );
      expect(registered).toBe(true);
    });

    it("should register CallTool handler", () => {
      const registered = initialSetRequestHandlerCalls.some(
        ([schema]) => schema === "CallToolRequestSchema"
      );
      expect(registered).toBe(true);
    });

    it("should connect to transport", () => {
      expect(wasConnectCalled).toBe(true);
    });

    it("delegates Session State schema initialization to the state manager", () => {
      expect(initialSessionSchemaCalls).toEqual([[mockDbInstance]]);
    });
  });

  describe("handleListTools", () => {
    it("should return tools array", () => {
      const handler = registeredHandlers.get("ListToolsRequestSchema");
      expect(handler).toBeTruthy();
      const result = (handler as Function)({});
      expect(result).toHaveProperty("tools");
      expect(Array.isArray(result.tools)).toBe(true);
      expect(result.tools.length).toBeGreaterThan(0);
    });

    it("should include omp_get_session_state tool", () => {
      const handler = registeredHandlers.get("ListToolsRequestSchema") as Function;
      const result = handler({});
      const names = result.tools.map((t: any) => t.name);
      expect(names).toContain("omp_get_session_state");
    });

    it("describes Session State storage without conflating it with Project Sessions", () => {
      const handler = registeredHandlers.get("ListToolsRequestSchema") as Function;
      const result = handler({});
      const getState = result.tools.find((tool: { name: string }) => tool.name === "omp_get_session_state");
      const saveState = result.tools.find((tool: { name: string }) => tool.name === "omp_save_session");

      expect(getState.description).toContain("Session State");
      expect(getState.description).not.toContain("PSM");
      expect(saveState.description).toContain("SQLite or JSON fallback");
    });

    it("should include omp_delegate_task tool", () => {
      const handler = registeredHandlers.get("ListToolsRequestSchema") as Function;
      const result = handler({});
      const names = result.tools.map((t: any) => t.name);
      expect(names).toContain("omp_delegate_task");
    });
  });

  describe("handleCallTool via request handler", () => {
    async function callTool(name: string, args: Record<string, unknown> = {}) {
      const handler = registeredHandlers.get("CallToolRequestSchema") as Function;
      return handler({ params: { name, arguments: args } });
    }

    it("omp_get_session_state delegates through the state manager", async () => {
      sessionStateManager.getLatestSession.mockReturnValue({ id: "s1", state_json: "{}" });
      const result = await callTool("omp_get_session_state");
      expect(sessionStateManager.getLatestSession).toHaveBeenCalledWith(mockDbInstance);
      expect(result.content[0].type).toBe("text");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("id", "s1");
    });

    it("omp_get_session_state returns null when no sessions", async () => {
      const result = await callTool("omp_get_session_state");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toBeNull();
    });

    it("omp_save_session should insert a session", async () => {
      const result = await callTool("omp_save_session", {
        sessionId: "my-id",
        worktreeId: "wt-1",
        stateJson: '{"status":"active"}',
      });
      expect(sessionStateManager.saveSession).toHaveBeenCalledWith(
        "my-id",
        "wt-1",
        '{"status":"active"}',
        mockDbInstance
      );
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe("ok");
      expect(parsed.sessionId).toBe("my-id");
    });

    it("omp_save_session should generate uuid when no sessionId provided", async () => {
      const result = await callTool("omp_save_session");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.sessionId).toBeTruthy();
    });

    it("omp_list_sessions should return sessions array", async () => {
      sessionStateManager.listSessions.mockReturnValue([
        { id: "s1", worktree_id: null, state_json: "{}", created_at: 1, updated_at: 2 },
      ]);
      const result = await callTool("omp_list_sessions");
      expect(sessionStateManager.listSessions).toHaveBeenCalledWith(mockDbInstance);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([{ id: "s1", created_at: 1, updated_at: 2 }]);
    });

    it("omp_get_agents should return agents list", async () => {
      const result = await callTool("omp_get_agents");
      const parsed = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.some((a: any) => a.id === "executor")).toBe(true);
    });

    it("omp_delegate_task should route to known agent", async () => {
      const result = await callTool("omp_delegate_task", { agentId: "executor", task: "do stuff" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe("routed");
      expect(parsed.agentId).toBe("executor");
    });

    it("omp_delegate_task returns not_found for unknown agent", async () => {
      const result = await callTool("omp_delegate_task", { agentId: "ghost", task: "do stuff" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.status).toBe("not_found");
    });

    it("omp_activate_skill should return activated:true", async () => {
      const result = await callTool("omp_activate_skill", { skillId: "autopilot" });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.activated).toBe(true);
      expect(parsed.skillId).toBe("autopilot");
    });

    it("omp_get_hud_state returns fallback when hud file missing", async () => {
      const result = await callTool("omp_get_hud_state");
      expect(result.content[0].text).toContain("No HUD state available");
    });

    it("omp_subscribe_hud_events returns subscribed:true", async () => {
      const result = await callTool("omp_subscribe_hud_events", { eventTypes: ["hud:update"] });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.subscribed).toBe(true);
    });

    it("omp_invoke_hook returns invoked:true", async () => {
      const result = await callTool("omp_invoke_hook", { hookId: "model-router", input: {} });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.invoked).toBe(true);
      expect(parsed.hookId).toBe("model-router");
    });

    it("omp_fleet_status returns fleet size", async () => {
      const result = await callTool("omp_fleet_status");
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty("fleet_size");
    });

    it("unknown tool returns error response", async () => {
      const result = await callTool("omp_unknown_tool");
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain("Unknown tool");
    });
  });
});
