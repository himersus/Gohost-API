
import { sendSocketContent } from "../sockets/index"
import prisma from "../lib/prisma";
import { spawn } from "child_process";
import { registerStream } from "./streams";

export function collectLogs(deployId: string, projectId: string, logLines: string[]) {
  for (const line of logLines) {
    if (!line.trim()) continue;

    console.log("[log]", line);

    sendSocketContent("deploy_logs", {
      projectId: projectId,
      deployId: deployId,
      status: "running",
      message: line
    });

    prisma.deploy.update({
      where: { id: deployId },
      data: {
        logs: {
          push: line
        }
      }
    }).catch((err) => {
      console.error("[log db error]", err);
    });
  }
}

export function startLogStream(deployId: string, projectId: string, containerName: string) {
  if (!containerName || !deployId) {
    console.error("Container name is required to start log stream.");
    return;
  }

  const logs = spawn("docker", [
    "logs",
    "-f",
    "--tail=50",
    containerName
  ]);

  const streamId = `deploy:${deployId}`;
  registerStream(streamId, logs);

  logs.stdout.on("data", (data: Buffer) => {
    const lines = data.toString().split("\n");
    collectLogs(deployId, projectId, lines);
  });

  logs.stderr.on("data", (data: Buffer) => {
    console.error("[log error]", data.toString());
  });

  logs.on("close", (code) => {
    console.log(`[logs] stream finalizado para ${containerName} (código: ${code})`);
  });
}
