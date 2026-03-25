"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const is = {
  dev: !electron.app.isPackaged
};
const platform = {
  isWindows: process.platform === "win32",
  isMacOS: process.platform === "darwin",
  isLinux: process.platform === "linux"
};
const electronApp = {
  setAppUserModelId(id) {
    if (platform.isWindows)
      electron.app.setAppUserModelId(is.dev ? process.execPath : id);
  },
  setAutoLaunch(auto) {
    if (platform.isLinux)
      return false;
    const isOpenAtLogin = () => {
      return electron.app.getLoginItemSettings().openAtLogin;
    };
    if (isOpenAtLogin() !== auto) {
      electron.app.setLoginItemSettings({
        openAtLogin: auto,
        path: process.execPath
      });
      return isOpenAtLogin() === auto;
    } else {
      return true;
    }
  },
  skipProxy() {
    return electron.session.defaultSession.setProxy({ mode: "direct" });
  }
};
const optimizer = {
  watchWindowShortcuts(window, shortcutOptions) {
    if (!window)
      return;
    const { webContents } = window;
    const { escToCloseWindow = false, zoom = false } = shortcutOptions || {};
    webContents.on("before-input-event", (event, input) => {
      if (input.type === "keyDown") {
        if (!is.dev) {
          if (input.code === "KeyR" && (input.control || input.meta))
            event.preventDefault();
        } else {
          if (input.code === "F12") {
            if (webContents.isDevToolsOpened()) {
              webContents.closeDevTools();
            } else {
              webContents.openDevTools({ mode: "undocked" });
              console.log("Open dev tool...");
            }
          }
        }
        if (escToCloseWindow) {
          if (input.code === "Escape" && input.key !== "Process") {
            window.close();
            event.preventDefault();
          }
        }
        if (!zoom) {
          if (input.code === "Minus" && (input.control || input.meta))
            event.preventDefault();
          if (input.code === "Equal" && input.shift && (input.control || input.meta))
            event.preventDefault();
        }
      }
    });
  },
  registerFramelessWindowIpc() {
    electron.ipcMain.on("win:invoke", (event, action) => {
      const win = electron.BrowserWindow.fromWebContents(event.sender);
      if (win) {
        if (action === "show") {
          win.show();
        } else if (action === "showInactive") {
          win.showInactive();
        } else if (action === "min") {
          win.minimize();
        } else if (action === "max") {
          const isMaximized = win.isMaximized();
          if (isMaximized) {
            win.unmaximize();
          } else {
            win.maximize();
          }
        } else if (action === "close") {
          win.close();
        }
      }
    });
  }
};
let adminWindow = null;
let projectorWindow = null;
function createWindows() {
  const displays = electron.screen.getAllDisplays();
  const externalDisplay = displays.find((display) => {
    return display.bounds.x !== 0 || display.bounds.y !== 0;
  });
  adminWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  if (!adminWindow) return;
  adminWindow.on("ready-to-show", () => {
    adminWindow?.show();
  });
  adminWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    adminWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#admin`);
  } else {
    adminWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: "admin" });
  }
  if (externalDisplay) {
    projectorWindow = new electron.BrowserWindow({
      x: externalDisplay.bounds.x,
      y: externalDisplay.bounds.y,
      fullscreen: true,
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        sandbox: false
      }
    });
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      projectorWindow.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#projector`);
    } else {
      projectorWindow.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: "projector" });
    }
    projectorWindow.on("closed", () => {
      projectorWindow = null;
    });
  }
}
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.techverse.quizarena");
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.handle("get-version", () => electron.app.getVersion());
  electron.ipcMain.handle("get-collections", async () => {
    const collectionsPath = path.join(electron.app.getAppPath(), "data/collections");
    try {
      const files = await promises.readdir(collectionsPath);
      return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    } catch (err) {
      console.error("Failed to read collections:", err);
      return [];
    }
  });
  electron.ipcMain.handle("get-collection", async (_, name) => {
    const filePath = path.join(electron.app.getAppPath(), "data/collections", `${name}.json`);
    try {
      const content = await promises.readFile(filePath, "utf-8");
      return JSON.parse(content);
    } catch (err) {
      console.error(`Failed to read collection ${name}:`, err);
      return null;
    }
  });
  electron.ipcMain.handle("save-collection", async (_, name, questions) => {
    const filePath = path.join(electron.app.getAppPath(), "data/collections", `${name}.json`);
    try {
      await promises.writeFile(filePath, JSON.stringify(questions, null, 2));
      return true;
    } catch (err) {
      console.error(`Failed to save collection ${name}:`, err);
      return false;
    }
  });
  electron.ipcMain.handle("create-collection", async (_, name) => {
    const filePath = path.join(electron.app.getAppPath(), "data/collections", `${name}.json`);
    try {
      if (path.join(electron.app.getAppPath(), "data/collections", `${name}.json`).includes("..")) return false;
      await promises.writeFile(filePath, JSON.stringify([], null, 2));
      return true;
    } catch (err) {
      console.error(`Failed to create collection ${name}:`, err);
      return false;
    }
  });
  electron.ipcMain.handle("delete-collection", async (_, name) => {
    const filePath = path.join(electron.app.getAppPath(), "data/collections", `${name}.json`);
    try {
      const { unlink } = require("fs/promises");
      await unlink(filePath);
      return true;
    } catch (err) {
      console.error(`Failed to delete collection ${name}:`, err);
      return false;
    }
  });
  electron.ipcMain.handle("rename-collection", async (_, oldName, newName) => {
    const oldPath = path.join(electron.app.getAppPath(), "data/collections", `${oldName}.json`);
    const newPath = path.join(electron.app.getAppPath(), "data/collections", `${newName}.json`);
    try {
      await promises.rename(oldPath, newPath);
      return true;
    } catch (err) {
      console.error(`Failed to rename collection from ${oldName} to ${newName}:`, err);
      return false;
    }
  });
  electron.ipcMain.on("update-quiz-state", (_, state) => {
    if (projectorWindow) {
      projectorWindow.webContents.send("quiz-state-update", state);
    }
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  createWindows();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindows();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
