import fs from 'fs';

export function configure(outDir) {
  if (!fs.existsSync(".vscode"))
    fs.mkdirSync(".vscode");

  if (!fs.existsSync(".vscode/launch.json")) {
    fs.writeFileSync(".vscode/launch.json", JSON.stringify({
      "version": "0.2.0",
      "configurations": []
    }));
  }

  if (!fs.existsSync(".vscode/tasks.json")) {
    fs.writeFileSync(".vscode/tasks.json", JSON.stringify({
      "version": "2.0.0",
      "tasks": []
    }));
  }

  let launchConfigStr = fs.readFileSync(".vscode/launch.json", 'utf-8');
  launchConfigStr = launchConfigStr.replace(/\/\/.*/g, '');
  const launchConfig = JSON.parse(launchConfigStr);
  const launchConfigExists = launchConfig.configurations.find((config) => config.name === "Debug Lambda functions");
  if (!launchConfigExists) launchConfig.configurations.push(
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Lambda functions",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/nodemon",
      "skipFiles": ["<node_internals>/**"],
      "program": "${workspaceFolder}/node_modules/lambda-debug/connect.js",
      "restart": true,
      "env": {
        "outDir": outDir
      },
      "postDebugTask": "lambda-debug-cleanup",
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
  );

  fs.writeFileSync(".vscode/launch.json", JSON.stringify(launchConfig, null, 2));

  let tasksConfigStr = fs.readFileSync(".vscode/tasks.json", 'utf-8');
  tasksConfigStr = launchConfigStr.replace(/\/\/.*/g, '');
  const tasksConfig = JSON.parse(tasksConfigStr);
  const tasksConfigExists = tasksConfig.tasks.find((config) => config.label === "lambda-debug-cleanup");

  if (!tasksConfigExists) tasksConfig.tasks.push(
    {
      "label": "lambda-debug-cleanup",
      "type": "shell",
      "command": "node ${workspaceFolder}/node_modules/lambda-debug/cleanup.js"
    });

  fs.writeFileSync(".vscode/tasks.json", JSON.stringify(tasksConfig, null, 2));
}