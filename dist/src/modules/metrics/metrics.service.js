"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getServiceMetrics = getServiceMetrics;
exports.getGeneralMetrics = getGeneralMetrics;
exports.getVpsMetrics = getVpsMetrics;
const child_process_1 = require("child_process");
const util_1 = require("util");
const repo = __importStar(require("./metrics.repository"));
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
async function dockerExec(container, args) {
    const { stdout } = await execFileAsync("docker", ["exec", container, ...args]);
    return stdout.trim();
}
async function getContainerUptime(container) {
    const { stdout } = await execFileAsync("docker", [
        "inspect", "--format", "{{.State.StartedAt}}", container,
    ]);
    return (Date.now() - new Date(stdout.trim()).getTime()) / 1000;
}
async function isContainerRunning(container) {
    try {
        const { stdout } = await execFileAsync("docker", [
            "inspect", "--format", "{{.State.Status}}", container,
        ]);
        return stdout.trim() === "running";
    }
    catch {
        return false;
    }
}
function formatUptime(seconds) {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return [d > 0 ? `${d}d` : "", h > 0 ? `${h}h` : "", m > 0 ? `${m}m` : "", `${s}s`].filter(Boolean).join(" ");
}
async function getServiceMetrics(projectId) {
    const project = await repo.findProjectById(projectId);
    if (!project)
        throw { status: 404, message: "Projeto não encontrado" };
    const serviceName = project.subdomain;
    if (!/^[a-zA-Z0-9_-]+$/.test(serviceName)) {
        throw { status: 400, message: "Nome do serviço inválido" };
    }
    const running = await isContainerRunning(serviceName);
    if (!running) {
        throw { status: 404, message: `Serviço '${serviceName}' não encontrado ou não está rodando` };
    }
    const [cpuRaw, memRaw, uptimeSeconds, latencyMs] = await Promise.all([
        dockerExec(serviceName, ["awk", "NR==1{u=$2+$4; t=$2+$3+$4+$5; print u*100/t}", "/proc/stat"]),
        dockerExec(serviceName, ["awk", "/MemTotal/{t=$2} /MemAvailable/{a=$2} END{u=t-a; print u/1024, t/1024, u*100/t}", "/proc/meminfo"]),
        getContainerUptime(serviceName),
        (async () => { const s = Date.now(); await dockerExec(serviceName, ["echo", "ok"]); return Date.now() - s; })(),
    ]);
    const [usedMB, totalMB, memPercent] = memRaw.split(" ").map(parseFloat);
    return {
        service: serviceName,
        metrics: {
            cpu: { usage_percent: parseFloat(parseFloat(cpuRaw).toFixed(2)) },
            memory: {
                used_mb: parseFloat(usedMB.toFixed(2)),
                total_mb: parseFloat(totalMB.toFixed(2)),
                usage_percent: parseFloat(memPercent.toFixed(1)),
            },
            uptime: { seconds: uptimeSeconds, human: formatUptime(uptimeSeconds) },
            latency: { exec_ms: latencyMs },
        },
        collected_at: new Date().toISOString(),
    };
}
async function getGeneralMetrics(userId) {
    const projects = await repo.findProjectsByUser(userId);
    if (projects.length === 0)
        throw { status: 404, message: "Nenhum projeto encontrado" };
    const results = await Promise.allSettled(projects.map(async (p) => {
        const container = p.subdomain;
        const running = await isContainerRunning(container);
        if (!running) {
            return { project_id: p.id, subdomain: p.subdomain, container, status: "offline", memory: { used_mb: 0, total_mb: 0, usage_percent: 0 } };
        }
        const memRaw = await dockerExec(container, ["awk", "/MemTotal/{t=$2} /MemAvailable/{a=$2} END{u=t-a; print u/1024, t/1024, u*100/t}", "/proc/meminfo"]);
        const [usedMB, totalMB, percent] = memRaw.split(" ").map(parseFloat);
        return { project_id: p.id, subdomain: p.subdomain, container, status: "online", memory: { used_mb: parseFloat(usedMB.toFixed(2)), total_mb: parseFloat(totalMB.toFixed(2)), usage_percent: parseFloat(percent.toFixed(1)) } };
    }));
    const successful = results.filter((r) => r.status === "fulfilled").map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected").map((_, i) => ({ project_id: projects[i].id, subdomain: projects[i].subdomain, container: projects[i].subdomain }));
    const avg = successful.length > 0 ? {
        used_mb: parseFloat((successful.reduce((a, p) => a + p.memory.used_mb, 0) / successful.length).toFixed(2)),
        total_mb: parseFloat((successful.reduce((a, p) => a + p.memory.total_mb, 0) / successful.length).toFixed(2)),
        usage_percent: parseFloat((successful.reduce((a, p) => a + p.memory.usage_percent, 0) / successful.length).toFixed(1)),
    } : null;
    return {
        average: { total_projects: projects.length, collected: successful.length, average_memory: avg, projects: successful, ...(failed.length > 0 && { failed }), collected_at: new Date().toISOString() },
        services: { total: projects.length, successful: successful.length, failed: failed.length, collected_at: new Date().toISOString() },
        payment: { total: projects.reduce((a, p) => a + p.payments.length, 0) },
        members: { total: projects.reduce((a, p) => a + p.user_workspace.length, 0) },
    };
}
async function runCommand(cmd, args) {
    const { stdout } = await execFileAsync(cmd, args);
    return stdout.trim();
}
async function getVpsMetrics() {
    const [memRaw, diskRaw, uptimeRaw, loadRaw] = await Promise.all([
        runCommand("awk", ["/MemTotal/{t=$2} /MemAvailable/{a=$2} END{u=t-a; print u/1024, t/1024, u*100/t}", "/proc/meminfo"]),
        runCommand("df", ["-h", "--output=used,size,pcent", "/"]),
        runCommand("cat", ["/proc/uptime"]),
        runCommand("cat", ["/proc/loadavg"]),
    ]);
    const [usedMB, totalMB, memPercent] = memRaw.split(" ").map(parseFloat);
    const diskLines = diskRaw.trim().split("\n");
    const diskVals = diskLines[diskLines.length - 1].trim().split(/\s+/);
    const uptimeSec = parseFloat(uptimeRaw.split(" ")[0]);
    const [l1, l5, l15] = loadRaw.split(" ").map(parseFloat);
    return {
        memory: { used_mb: parseFloat(usedMB.toFixed(2)), total_mb: parseFloat(totalMB.toFixed(2)), usage_percent: parseFloat(memPercent.toFixed(1)) },
        disk: { used: diskVals[0], total: diskVals[1], usage_percent: parseFloat(diskVals[2].replace("%", "")) },
        uptime: { seconds: uptimeSec, human: formatUptime(uptimeSec) },
        load_average: { "1m": l1, "5m": l5, "15m": l15 },
        collected_at: new Date().toISOString(),
    };
}
