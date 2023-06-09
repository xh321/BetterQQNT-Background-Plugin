const fs = require("fs");
const path = require("path");
const { BrowserWindow, ipcMain } = require("electron");
const { dialog } = require("electron");

const allowedExt = ["JPG", "BMP", "PNG", "WEBP", "JPEG"];
const configFilePath = path.join(__dirname, "config.json");
const sampleConfig = {
    imgDir: path.join(__dirname, "imgs").replaceAll("\\", "/"),
    imgSource: "folder",
    refreshTime: 600,
    isAutoRefresh: true,
    overrideImgFile: ""
};
var nowConfig = loadConfig();

function readdir(res) {
    return new Promise((resolve, reject) => {
        fs.readdir(res, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

// 读取文件属性
function filestat(res) {
    return new Promise((resolve, reject) => {
        fs.stat(res, (err, data) => {
            if (err) {
                reject(err);
            }
            resolve(data);
        });
    });
}

// 获取图片文件名称
function filename(picDir) {
    return new Promise((resolve, reject) => {
        readdir(picDir)
            .then((data) => {
                let paths = [];
                let name;
                data.map((name, index) => {
                    let tmpPath = picDir + "/" + name;
                    //let tmpPath = path.join(picDir, name)
                    filestat(tmpPath)
                        .then((stats) => {
                            if (
                                !stats.isDirectory() &&
                                allowedExt.indexOf(
                                    path.extname(tmpPath).toUpperCase().slice(1)
                                ) != -1
                            ) {
                                paths.push(tmpPath.replace("\\", "/"));
                            }
                            if (index + 1 === data.length) {
                                resolve(paths);
                            }
                        })
                        .catch((err) => {
                            reject(err);
                        });
                });
            })
            .catch((err) => {
                reject(err);
            });
    });
}

// 获取0到n的随机整数
function rd(n) {
    return Math.floor(Math.random() * (n + 1));
}

// 随机获取一张图片路径
function rdpic() {
    return new Promise((resolve, reject) => {
        if (
            nowConfig.overrideImgFile != null &&
            fs.existsSync(nowConfig.overrideImgFile)
        ) {
            resolve(nowConfig.overrideImgFile);
            return;
        }
        //目录
        if (nowConfig.imgSource == null || nowConfig.imgSource == "folder") {
            filename(nowConfig.imgDir).then((data) => {
                let n = rd(data.length - 1);
                resolve(data[n]);
            });
        } else {
            resolve(nowConfig.imgDir); //文件
        }
    });
}

// 防抖函数
function debounce(fn, time) {
    let timer = null;
    return function (...args) {
        timer && clearTimeout(timer);
        timer = setTimeout(() => {
            fn.apply(this, args);
        }, time);
    };
}

// 监听配置文件修改
function watchConfigChange() {
    if (!fs.existsSync(configFilePath)) {
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(sampleConfig, null, 2),
            "utf-8"
        );
    }
    fs.watch(
        configFilePath,
        "utf-8",
        debounce(() => {
            nowConfig = loadConfig();
            mainWindowObj.webContents.send(
                "LiteLoader.background_plugin.mainWindow.resetTimer"
            );
            mainWindowObj.webContents.send(
                "LiteLoader.background_plugin.mainWindow.reloadBg"
            );
        }, 100)
    );
}

function loadConfig() {
    if (!fs.existsSync(configFilePath)) {
        fs.writeFileSync(
            configFilePath,
            JSON.stringify(sampleConfig, null, 2),
            "utf-8"
        );
        return sampleConfig;
    } else {
        return JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
    }
}

function writeConfig() {
    fs.writeFileSync(
        configFilePath,
        JSON.stringify(nowConfig, null, 2),
        "utf-8"
    );
}

function onLoad(plugin) {
    ipcMain.handle(
        "LiteLoader.background_plugin.resetTimer",
        async (event, message) => {
            mainWindowObj.webContents.send(
                "LiteLoader.background_plugin.mainWindow.resetTimer"
            );
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.reloadBg",
        async (event, message) => {
            mainWindowObj.webContents.send(
                "LiteLoader.background_plugin.mainWindow.reloadBg"
            );
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.showFolderSelect",
        (event, message) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            let filePath = dialog.showOpenDialogSync(window, {
                title: "请选择背景图所在的文件夹",
                properties: ["openDirectory"] // 选择文件夹
            });
            nowConfig.imgSource = "folder";
            nowConfig.imgDir = filePath.toString().replaceAll("\\", "/");
            writeConfig();
            return filePath;
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.showFileSelect",
        (event, message) => {
            const window = BrowserWindow.fromWebContents(event.sender);
            var allowedExtStr = `*.${allowedExt[0]};`;
            allowedExt.forEach((i) => {
                allowedExtStr += `*.${i};`;
            });
            let filePath = dialog.showOpenDialogSync(window, {
                title: "请选择一张图片作为背景图",
                properties: ["openFile"], // 选择文件
                filters: [
                    {
                        name: `图片文件(${allowedExtStr})`,
                        extensions: allowedExt
                    },
                    { name: "所有文件(*.*)", extensions: ["*"] }
                ]
            });
            nowConfig.imgSource = "file";
            nowConfig.imgDir = filePath.toString().replaceAll("\\", "/");
            writeConfig();
            return filePath;
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.setAutoRefresh",
        (event, isAutoRefresh) => {
            nowConfig.isAutoRefresh = isAutoRefresh;
            writeConfig();
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.changeRefreshTime",
        (event, refreshTime) => {
            nowConfig.refreshTime = refreshTime;
            writeConfig();
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.randomSelect",
        async (event, message) => {
            return await rdpic();
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.getNowConfig",
        async (event, message) => {
            return nowConfig;
        }
    );

    ipcMain.handle(
        "LiteLoader.background_plugin.getRefreshTime",
        async (event, message) => {
            return nowConfig.refreshTime;
        }
    );
}

var mainWindowObj = null;
function onBrowserWindowCreated(window) {
    watchConfigChange();

    window.webContents.on("did-stop-loading", () => {
        if (window.webContents.getURL().indexOf("#/main/message") != -1) {
            mainWindowObj = window;
        }
    });
}

module.exports = {
    onLoad,
    onBrowserWindowCreated
};
