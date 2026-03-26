"use strict";
const electron = require("electron");
const path = require("path");
const promises = require("fs/promises");
const events = require("events");
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
class DisplayManager extends events.EventEmitter {
  primaryDisplay = null;
  secondaryDisplay = null;
  initialized = false;
  constructor() {
    super();
  }
  initialize() {
    if (this.initialized) return;
    this.updateDisplays();
    electron.screen.on("display-added", () => this.handleDisplayChange());
    electron.screen.on("display-removed", () => this.handleDisplayChange());
    electron.screen.on("display-metrics-changed", () => this.handleDisplayChange());
    this.initialized = true;
  }
  updateDisplays() {
    const displays = electron.screen.getAllDisplays();
    console.log("[DISPLAY] Detected displays count:", displays.length);
    this.primaryDisplay = electron.screen.getPrimaryDisplay();
    this.secondaryDisplay = displays.find((d) => d.id !== this.primaryDisplay?.id) || null;
    console.log("[DISPLAY] Primary ID:", this.primaryDisplay?.id, "Secondary ID:", this.secondaryDisplay?.id);
  }
  handleDisplayChange() {
    const oldSecondaryId = this.secondaryDisplay?.id;
    this.updateDisplays();
    if (this.secondaryDisplay && this.secondaryDisplay.id !== oldSecondaryId) {
      this.emit("secondary-display-added", this.secondaryDisplay);
    } else if (!this.secondaryDisplay && oldSecondaryId) {
      this.emit("secondary-display-removed");
    } else {
      this.emit("display-metrics-changed", this.secondaryDisplay);
    }
  }
  getPrimaryDisplay() {
    return this.primaryDisplay;
  }
  getSecondaryDisplay() {
    return this.secondaryDisplay;
  }
  hasSecondaryDisplay() {
    return this.secondaryDisplay !== null;
  }
}
const displayManager = new DisplayManager();
class ProjectionWindowManager {
  window = null;
  constructor() {
  }
  createWindow() {
    console.log("[PROJECTION] Creating window...");
    if (this.window) {
      console.log("[PROJECTION] Window already exists, focusing.");
      this.window.focus();
      return;
    }
    const secondary = displayManager.getSecondaryDisplay();
    const bounds = secondary ? secondary.bounds : { x: 0, y: 0, width: 1024, height: 768 };
    console.log("[PROJECTION] Using display bounds:", bounds, "Secondary exists:", !!secondary);
    this.window = new electron.BrowserWindow({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      fullscreen: !!secondary,
      frame: false,
      resizable: false,
      movable: false,
      alwaysOnTop: !!secondary,
      backgroundColor: "#050505",
      autoHideMenuBar: true,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        sandbox: false,
        contextIsolation: true
      }
    });
    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
      this.window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#projector`);
      this.window.webContents.openDevTools({ mode: "detach" });
    } else {
      this.window.loadFile(path.join(__dirname, "../renderer/index.html"), { hash: "projector" });
    }
    this.window.on("closed", () => {
      this.window = null;
    });
    this.window.on("close", (e) => {
      if (displayManager.hasSecondaryDisplay()) ;
    });
  }
  destroyWindow() {
    if (this.window) {
      this.window.close();
      this.window = null;
    }
  }
  sendState(state) {
    if (this.window) {
      this.window.webContents.send("quiz-state-update", state);
    }
  }
  isAlive() {
    return this.window !== null;
  }
  handleDisplayChange() {
    if (displayManager.hasSecondaryDisplay()) {
      if (!this.window) {
        this.createWindow();
      } else {
        const secondary = displayManager.getSecondaryDisplay();
        if (secondary) {
          this.window.setBounds(secondary.bounds);
          this.window.setFullScreen(true);
        }
      }
    } else {
      this.destroyWindow();
    }
  }
}
const projectionWindowManager = new ProjectionWindowManager();
let adminWindow = null;
function createAdminWindow() {
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
}
electron.app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.techverse.quizarena");
  electron.app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });
  displayManager.initialize();
  displayManager.on("secondary-display-added", () => {
    projectionWindowManager.createWindow();
  });
  displayManager.on("secondary-display-removed", () => {
    projectionWindowManager.destroyWindow();
  });
  displayManager.on("display-metrics-changed", () => {
    projectionWindowManager.handleDisplayChange();
  });
  electron.ipcMain.handle("get-version", () => electron.app.getVersion());
  electron.ipcMain.handle("get-display-info", () => {
    const displays = electron.screen.getAllDisplays();
    const primary = electron.screen.getPrimaryDisplay();
    const secondary = displays.find((d) => d.id !== primary.id);
    return {
      count: displays.length,
      primaryRes: `${primary.bounds.width}x${primary.bounds.height}`,
      secondaryRes: secondary ? `${secondary.bounds.width}x${secondary.bounds.height}` : "N/A",
      isProjectorAlive: projectionWindowManager.isAlive()
    };
  });
  const collectionsPath = path.join(electron.app.getAppPath(), "data/collections");
  electron.ipcMain.handle("get-collections", async () => {
    try {
      const files = await promises.readdir(collectionsPath);
      return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(".json", ""));
    } catch (err) {
      return [];
    }
  });
  electron.ipcMain.handle("get-collection", async (_, name) => {
    try {
      const content = await promises.readFile(path.join(collectionsPath, `${name}.json`), "utf-8");
      return JSON.parse(content);
    } catch (err) {
      return null;
    }
  });
  electron.ipcMain.handle("save-collection", async (_, name, questions) => {
    try {
      await promises.writeFile(path.join(collectionsPath, `${name}.json`), JSON.stringify(questions, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  });
  electron.ipcMain.handle("create-collection", async (_, name) => {
    try {
      await promises.writeFile(path.join(collectionsPath, `${name}.json`), JSON.stringify([], null, 2));
      return true;
    } catch (err) {
      return false;
    }
  });
  electron.ipcMain.handle("delete-collection", async (_, name) => {
    try {
      const { unlink } = require("fs/promises");
      await unlink(path.join(collectionsPath, `${name}.json`));
      return true;
    } catch (err) {
      return false;
    }
  });
  electron.ipcMain.handle("rename-collection", async (_, oldName, newName) => {
    try {
      await promises.rename(path.join(collectionsPath, `${oldName}.json`), path.join(collectionsPath, `${newName}.json`));
      return true;
    } catch (err) {
      return false;
    }
  });
  const resultsPath = path.join(electron.app.getAppPath(), "data/results");
  require("fs/promises").mkdir(resultsPath, { recursive: true }).catch(console.error);
  electron.ipcMain.handle("save-quiz-result", async (_, result) => {
    try {
      await promises.writeFile(path.join(resultsPath, `result_${result.id || Date.now()}.json`), JSON.stringify(result, null, 2));
      return true;
    } catch (err) {
      return false;
    }
  });
  electron.ipcMain.handle("get-quiz-results", async () => {
    try {
      const files = await promises.readdir(resultsPath);
      const results = await Promise.all(
        files.filter((f) => f.endsWith(".json")).map(async (file) => {
          const content = await promises.readFile(path.join(resultsPath, file), "utf-8");
          return JSON.parse(content);
        })
      );
      return results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (err) {
      return [];
    }
  });
  electron.ipcMain.on("update-quiz-state", (_, state) => {
    projectionWindowManager.sendState(state);
  });
  electron.ipcMain.on("open-projector", () => {
    projectionWindowManager.createWindow();
  });
  createAdminWindow();
  if (displayManager.hasSecondaryDisplay() || is.dev) {
    projectionWindowManager.createWindow();
  }
  electron.app.on("activate", () => {
    if (electron.BrowserWindow.getAllWindows().length === 0) createAdminWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") electron.app.quit();
});
