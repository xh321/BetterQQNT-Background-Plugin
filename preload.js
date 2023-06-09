const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("background_plugin", {
    reloadBgListener: (callback) =>
        ipcRenderer.on(
            "LiteLoader.background_plugin.mainWindow.reloadBg",
            callback
        ),
    resetTimerListener: (callback) =>
        ipcRenderer.on(
            "LiteLoader.background_plugin.mainWindow.resetTimer",
            callback
        ),
    resetTimer: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.resetTimer"),
    reloadBg: () => ipcRenderer.invoke("LiteLoader.background_plugin.reloadBg"),
    showFolderSelect: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.showFolderSelect"),
    showFileSelect: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.showFileSelect"),
    randomSelect: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.randomSelect"),
    getRefreshTime: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.getRefreshTime"),
    getNowConfig: () =>
        ipcRenderer.invoke("LiteLoader.background_plugin.getNowConfig"),
    changeRefreshTime: (refreshTime) =>
        ipcRenderer.invoke(
            "LiteLoader.background_plugin.changeRefreshTime",
            refreshTime
        ),
    setAutoRefresh: (setAutoRefresh) =>
        ipcRenderer.invoke(
            "LiteLoader.background_plugin.setAutoRefresh",
            setAutoRefresh
        )
});
