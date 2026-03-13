import { useState } from "react";

const INSIGHT_TYPES = [
  { id: "incomplete", label: "Incomplete Sprint Items", icon: "📋", desc: "Current sprint issues missing parent, due date, team, or assignee", color: "border-l-blue-400", accent: "blue" },
  { id: "jira_config", label: "Jira Configuration Tips", icon: "⚙️", desc: "Specific configuration improvements with supporting detail", color: "border-l-green-400", accent: "green" },
];

function Badge({ color, children }) {
  const c = { blue: "bg-blue-100 text-blue-800", green: "bg-green-100 text-green-800", gray: "bg-gray-100 text-gray-600", orange: "bg-orange-100 text-orange-700", red: "bg-red-100 text-red-700" };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c[color] || c.gray}`}>{children}</span>;
}

function TagInput({ label, placeholder, values, onChange }) {
  const [input, setInput] = useState("");
  const add = () => { const v = input.trim(); if (v && !values.includes(v)) onChange([...values, v]); setInput(""); };
  const remove = v => onChange(values.filter(x => x !== v));
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          placeholder={placeholder} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
        <button onClick={add} className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {values.map(v => (
          <span key={v} className="flex items-center gap-1 bg-blue-50 border border-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">
            {v}<button onClick={() => remove(v)} className="text-blue-400 hover:text-blue-700 font-bold">×</button>
          </span>
        ))}
        {values.length === 0 && <span className="text-xs text-gray-400 italic">None added — agent will scan all accessible</span>}
      </div>
    </div>
  );
}

function EffortBadge({ effort }) {
  const styles = { Low: "bg-green-50 border-green-200 text-green-700", Medium: "bg-yellow-50 border-yellow-200 text-yellow-700", High: "bg-red-50 border-red-200 text-red-700" };
  if (!effort) return null;
  return <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${styles[effort] || styles.Medium}`}>{effort} effort</span>;
}

function MissingBadge({ label }) {
  return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 whitespace-nowrap">{label}</span>;
}

function MissingFieldInputs({ missing, values, onChange }) {
  if (!missing || missing.length === 0) return null;
  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Fill in missing fields</div>
      {missing.map(field => {
        const val = values[field] || "";
        const set = v => onChange({ ...values, [field]: v });
        if (field === "due date") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20 shrink-0">Due date</label>
            <input type="date" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );
        if (field === "assignee") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20 shrink-0">Assignee</label>
            <input type="text" placeholder="e.g. jane.smith" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );
        if (field === "team") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20 shrink-0">Team</label>
            <input type="text" placeholder="e.g. Platform" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );
        if (field === "parent") return (
          <div key={field} className="flex items-center gap-2">
            <label className="text-xs text-gray-600 w-20 shrink-0">Parent epic</label>
            <input type="text" placeholder="e.g. ENG-100" value={val} onChange={e => set(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
          </div>
        );
        return null;
      })}
    </div>
  );
}

function ConfigTipRow({ item }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors">
        <span className="text-green-500 mt-0.5">💡</span>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-800">{item.action}</div>
          <div className="text-xs text-gray-500 mt-0.5">{item.rationale}</div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <EffortBadge effort={item.effort} />
          <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {item.detail && (
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">What we found</div>
              <div className="text-sm text-gray-700 leading-relaxed">{item.detail}</div>
            </div>
          )}
          {item.recommendation && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <div className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">Recommendation</div>
              <div className="text-sm text-green-800 leading-relaxed">{item.recommendation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function IncompleteItemRow({ item, checked, onToggle, fieldValues, onFieldChange }) {
  const [open, setOpen] = useState(false);
  const missing = item.missing || [];
  const filledCount = missing.filter(f => fieldValues[f] && fieldValues[f].trim()).length;
  const allFilled = filledCount === missing.length;
  return (
    <div className="border-b border-gray-100 last:border-0">
      <div className="flex items-start gap-3 px-4 py-3">
        <input type="checkbox" className="mt-1 accent-blue-600" checked={checked} onChange={onToggle} />
        <button onClick={() => setOpen(o => !o)} className="flex-1 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-blue-700 font-mono">{item.key}</span>
            <span className="text-sm text-gray-700">{item.summary}</span>
          </div>
          <div className="flex gap-1.5 mt-1.5 flex-wrap">
            {missing.map(m => {
              const filled = fieldValues[m] && fieldValues[m].trim();
              return filled
                ? <span key={m} className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700 whitespace-nowrap">✓ {m}: {fieldValues[m]}</span>
                : <MissingBadge key={m} label={"Missing " + m} />;
            })}
          </div>
        </button>
        <span className="text-gray-400 text-xs mt-1 cursor-pointer select-none" onClick={() => setOpen(o => !o)}>
          {open ? "▲" : "▼"}
        </span>
      </div>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {item.detail && (
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <div className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Issue Detail</div>
              <div className="text-sm text-blue-900 leading-relaxed">{item.detail}</div>
            </div>
          )}
          <MissingFieldInputs missing={missing} values={fieldValues} onChange={onFieldChange} />
          {checked && !allFilled && (
            <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              ⚠️ Fill in all missing fields above before committing for best results.
            </div>
          )}
          {checked && allFilled && (
            <div className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              ✅ All fields filled — ready to commit.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InsightCard({ insight, finding, selectedItems, onToggle, fieldValues, onFieldChange }) {
  const id = insight.id;
  const items = finding.items || [];
  const checkedCount = items.filter((_, i) => selectedItems.includes(i)).length;
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${insight.color} rounded-lg shadow-sm overflow-hidden`}>
      <div className="p-4 pb-2">
        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{insight.icon}</span>
            <span className="font-semibold text-gray-800 text-sm">{insight.label}</span>
            {id === "jira_config" && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 border border-gray-200">ℹ️ Review only — click to expand</span>
            )}
          </div>
          {id !== "jira_config" && checkedCount > 0 && <Badge color="blue">{checkedCount} selected</Badge>}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed mb-2">{finding.summary}</p>
      </div>
      {items.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {id === "jira_config" ? "Recommendations" : "Issues to Address"}
          </div>
          <div>
            {items.map((item, i) =>
              id === "jira_config"
                ? <ConfigTipRow key={i} item={item} />
                : <IncompleteItemRow key={i} item={item}
                    checked={selectedItems.includes(i)}
                    onToggle={() => onToggle(i)}
                    fieldValues={(fieldValues[i]) || {}}
                    onFieldChange={vals => onFieldChange(i, vals)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buildPrompt(selected, jiraProjects) {
  const projectScope = jiraProjects.length
    ? `Focus only on these Jira projects: ${jiraProjects.join(", ")}.`
    : "Use the most active project available.";
  const tasks = [];
  if (selected.includes("incomplete"))
    tasks.push(`"incomplete": Find issues in the CURRENT active sprint that are missing any of: parent epic, due date, team, or assignee. Fetch max 15 issues. For each return:
  - "key": Jira issue key
  - "summary": issue title
  - "missing": array from ["parent", "due date", "team", "assignee"] that are absent
  - "detail": 1-2 sentences on current state and why missing fields matter`);
  if (selected.includes("jira_config"))
    tasks.push(`"jira_config": Fetch only project config, workflow settings, and issue type schemes — do NOT fetch issues. Identify up to 4 config problems. For each return:
  - "action": short improvement title
  - "rationale": one sentence summary
  - "effort": Low / Medium / High
  - "detail": 2-3 sentences on what you observed
  - "recommendation": 2-3 sentences with a concrete fix`);
  return `You are an org-wide activity intelligence agent in READ-ONLY mode. Do NOT create, update, or delete anything.
Scope: ${projectScope}
Fetch max 15 items per query, summary fields only.
Analyze:
${tasks.join("\n\n")}
Respond ONLY with valid JSON, no markdown, no backticks:
{
  ${selected.map(s => {
    if (s === "incomplete") return `"incomplete": { "summary": "...", "items": [ { "key": "...", "summary": "...", "missing": ["..."], "detail": "..." } ] }`;
    if (s === "jira_config") return `"jira_config": { "summary": "...", "items": [ { "action": "...", "rationale": "...", "effort": "Low", "detail": "...", "recommendation": "..." } ] }`;
    return `"${s}": { "summary": "...", "items": [] }`;
  }).join(",\n  ")}
}`;
}

export default function App() {
  const [selected, setSelected] = useState(INSIGHT_TYPES.map(i => i.id));
  const BACKEND_URL = "http://localhost:3002";
  const [jiraProjects, setJiraProjects] = useState([]);
  const [confluenceSpaces, setConfluenceSpaces] = useState([]);
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [findings, setFindings] = useState(null);
  const [selectedActions, setSelectedActions] = useState({});
  const [fieldValues, setFieldValues] = useState({});
  const [committed, setCommitted] = useState(false);
  const [queue, setQueue] = useState([]);
  const [error, setError] = useState(null);
  const [log, setLog] = useState([]);

  const resetAll = () => { setFindings(null); setSelectedActions({}); setFieldValues({}); setCommitted(false); setQueue([]); setError(null); setLog([]); setPhase("idle"); };
  const toggleInsight = id => setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const addLog = msg => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  const toggleAction = (insightId, itemIdx) => {
    setSelectedActions(prev => {
      const cur = prev[insightId] || [];
      return { ...prev, [insightId]: cur.includes(itemIdx) ? cur.filter(x => x !== itemIdx) : [...cur, itemIdx] };
    });
  };
  const updateFieldValue = (insightId, itemIdx, vals) => {
    setFieldValues(prev => ({ ...prev, [insightId]: { ...(prev[insightId] || {}), [itemIdx]: vals } }));
  };
  const totalSelected = Object.values(selectedActions).reduce((sum, arr) => sum + arr.length, 0);
  const insightMap = Object.fromEntries(INSIGHT_TYPES.map(i => [i.id, i]));
  const canRun = !running && selected.length > 0;

  const commitQueue = async () => {
    const newItems = [];
    Object.entries(selectedActions).forEach(([insightId, idxs]) => {
      const insight = insightMap[insightId];
      const finding = findings?.[insightId];
      if (!insight || !finding) return;
      idxs.forEach(idx => {
        const item = finding.items[idx];
        const fields = (fieldValues[insightId] || {})[idx] || {};
        if (item) newItems.push({ insightId, insightLabel: insight.label, insightIcon: insight.icon, itemIdx: idx, item, fields });
      });
    });

    // Write filled fields back to Jira
    for (const q of newItems) {
      if (!q.item.key || !q.fields) continue;
      const update = {};
      if (q.fields["due date"]) update.duedate = q.fields["due date"];
      if (q.fields["assignee"]) update.assignee = { name: q.fields["assignee"] };
      if (q.fields["parent"]) update.parent = { key: q.fields["parent"] };
      if (Object.keys(update).length > 0) {
        try {
          await fetch(`${BACKEND_URL}/api/jira/issue/${q.item.key}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fields: update }),
          });
          addLog(`✅ Updated ${q.item.key} in Jira`);
        } catch (e) {
          addLog(`⚠️ Failed to update ${q.item.key}: ${e.message}`);
        }
      }
    }

    setQueue(prev => {
      const existingKeys = new Set(prev.map(q => q.insightId + "-" + q.itemIdx));
      return [...prev, ...newItems.filter(n => !existingKeys.has(n.insightId + "-" + n.itemIdx))];
    });
    setCommitted(true);
  };

  const runAgent = async () => {
    if (!canRun) return;
    resetAll();
    setRunning(true);
    addLog(`Connecting to: ${BACKEND_URL}`);
    addLog(`Insights: ${selected.join(", ")} | Projects: ${jiraProjects.length ? jiraProjects.join(", ") : "auto"}`);
    try {
      const prompt = buildPrompt(selected, jiraProjects);
      addLog(`Prompt length: ${prompt.length} chars`);
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          mcp_servers: [{ type: "url", url: "https://mcp.atlassian.com/v1/mcp", name: "atlassian-mcp" }],
          messages: [{ role: "user", content: prompt }],
        }),
      });
      addLog(`HTTP status: ${resp.status}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(`API error ${resp.status}: ${data?.error?.message || JSON.stringify(data)}`);
      addLog(`Blocks: ${data.content?.length} | Stop: ${data.stop_reason}`);
      const toolCalls = data.content.filter(b => b.type === "mcp_tool_use");
      if (toolCalls.length) addLog(`Jira tools used: ${toolCalls.map(t => t.name).join(", ")}`);
      const text = data.content.filter(b => b.type === "text").map(b => b.text).join("\n");
      addLog(`Raw text (first 300 chars): ${text.slice(0, 300)}`);
      let parsed;
      try {
        const match = text.replace(/```json|```/g, "").trim().match(/\{[\s\S]*\}/);
        if (!match) throw new Error("No JSON object found");
        parsed = JSON.parse(match[0]);
      } catch (e) {
        addLog(`Full raw response: ${text}`);
        throw new Error(`JSON parse failed: ${e.message}`);
      }
      setFindings(parsed);
      setPhase("preview");
      addLog("✅ Findings ready.");
    } catch (e) {
      setError(e.message);
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-2xl">🤖</span>
            <h1 className="text-xl font-bold text-gray-900">Org-Wide Activity Agent</h1>
            <Badge color="blue">Live Mode</Badge>
            <Badge color="green">Preview / Read-Only</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">Connected to Jira via your Atlassian API token. Nothing changes without your approval.</p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Badge color="blue">Jira (live)</Badge>
            <Badge color="gray">Manual Trigger</Badge>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 space-y-4">
          <h2 className="font-semibold text-gray-800">🎯 Scope (optional)</h2>
          <p className="text-xs text-gray-500">Add project keys to narrow focus, or leave blank to auto-select.</p>
          <TagInput label="Jira Project Keys" placeholder="e.g. ENG, PLATFORM" values={jiraProjects} onChange={setJiraProjects} />
          <TagInput label="Confluence Space Keys" placeholder="e.g. ENGINEERING, OPS" values={confluenceSpaces} onChange={setConfluenceSpaces} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Select Insight Types</h2>
          <div className="grid grid-cols-1 gap-2">
            {INSIGHT_TYPES.map(({ id, label, icon, desc }) => {
              const active = selected.includes(id);
              return (
                <button key={id} onClick={() => toggleInsight(id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${active ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:bg-gray-100"}`}>
                  <span className="text-lg mt-0.5">{icon}</span>
                  <div className="flex-1">
                    <div className={`font-medium text-sm ${active ? "text-blue-800" : "text-gray-700"}`}>{label}</div>
                    <div className="text-xs text-gray-500">{desc}</div>
                  </div>
                  <span className="text-lg">{active ? "✅" : "⬜"}</span>
                </button>
              );
            })}
          </div>
        </div>

        <button onClick={runAgent} disabled={!canRun}
          className={`w-full py-3 rounded-xl font-semibold text-white text-sm transition-all shadow ${canRun ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-300 cursor-not-allowed"}`}>
          {running ? "🔍 Scanning Jira..." : "▶ Run Agent"}
        </button>

        {log.length > 0 && (
          <div className="bg-gray-900 rounded-xl p-4 text-xs font-mono text-green-400 space-y-1">
            <div className="flex justify-between items-center mb-2">
              <div className="text-gray-400 font-sans font-semibold text-xs">Activity Log</div>
              <button onClick={resetAll} className="text-xs text-gray-500 hover:text-gray-300 underline">Clear</button>
            </div>
            {log.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700"><strong>Error:</strong> {error}</div>}

        {findings && phase !== "idle" && (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">📊 Findings & Action Selection</h2>
            {selected.map(id => {
              const insight = insightMap[id];
              const finding = findings[id];
              if (!insight || !finding) return null;
              return (
                <InsightCard key={id} insight={insight} finding={finding}
                  selectedItems={selectedActions[id] || []}
                  onToggle={idx => toggleAction(id, idx)}
                  fieldValues={(fieldValues[id]) || {}}
                  onFieldChange={(idx, vals) => updateFieldValue(id, idx, vals)} />
              );
            })}
          </div>
        )}

        {totalSelected > 0 && !committed && (
          <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-gray-800 text-sm">{totalSelected} item{totalSelected !== 1 ? "s" : ""} selected</div>
              <div className="text-xs text-gray-500">Expand items to fill in missing fields, then commit</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedActions({})} className="px-3 py-2 rounded-lg text-sm text-gray-600 border border-gray-300 hover:bg-gray-50">Clear</button>
              <button onClick={commitQueue} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700">
                ✅ Commit {totalSelected} Item{totalSelected !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}

        {queue.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 bg-green-50 border-b border-green-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📥</span>
                <span className="font-semibold text-green-900 text-sm">Action Queue</span>
                <Badge color="green">{queue.length} item{queue.length !== 1 ? "s" : ""}</Badge>
              </div>
              <button onClick={() => setQueue([])} className="text-xs text-gray-400 hover:text-red-500 underline">Clear queue</button>
            </div>
            <div className="divide-y divide-gray-100">
              {queue.map((q, i) => (
                <div key={i} className="flex items-start gap-3 px-5 py-3">
                  <span className="text-base mt-0.5">{q.insightIcon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-semibold text-gray-500">{q.insightLabel}</span>
                      {q.item.key && <span className="text-xs font-mono text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{q.item.key}</span>}
                    </div>
                    <div className="text-sm font-medium text-gray-800">{q.item.action || q.item.summary}</div>
                    {q.fields && Object.keys(q.fields).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {Object.entries(q.fields).filter(([, v]) => v && v.trim()).map(([k, v]) => (
                          <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700">{k}: {v}</span>
                        ))}
                      </div>
                    )}
                    {q.item.missing && q.item.missing.filter(m => !q.fields?.[m]?.trim()).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {q.item.missing.filter(m => !q.fields?.[m]?.trim()).map(m => (
                          <MissingBadge key={m} label={"Still missing " + m} />
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => setQueue(prev => prev.filter((_, j) => j !== i))}
                    className="text-gray-300 hover:text-red-400 text-lg leading-none mt-0.5">×</button>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-500">Queued items will be written to Jira once write access is enabled.</p>
            </div>
          </div>
        )}

        {committed && queue.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
            <div className="font-semibold">✅ {totalSelected} item{totalSelected !== 1 ? "s" : ""} added to queue</div>
            <div className="text-xs text-green-700 mt-1">See the Action Queue above. Run again anytime for fresh findings.</div>
          </div>
        )}
      </div>
    </div>
  );
}
