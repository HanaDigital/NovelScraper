"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const env_paths_1 = require("env-paths");
const fs = require("fs-extra");
const path = require("path");
const sanitize = require("sanitize-filename");
const d = debug_1.default('@electron/get:cache');
const defaultCacheRoot = env_paths_1.default('electron', {
    suffix: '',
}).cache;
class Cache {
    constructor(cacheRoot = defaultCacheRoot) {
        this.cacheRoot = cacheRoot;
    }
    getCachePath(url, fileName) {
        const sanitizedUrl = sanitize(url);
        return path.resolve(this.cacheRoot, sanitizedUrl, fileName);
    }
    async getPathForFileInCache(url, fileName) {
        const cachePath = this.getCachePath(url, fileName);
        if (await fs.pathExists(cachePath)) {
            return cachePath;
        }
        return null;
    }
    async putFileInCache(url, currentPath, fileName) {
        const cachePath = this.getCachePath(url, fileName);
        d(`Moving ${currentPath} to ${cachePath}`);
        if (await fs.pathExists(cachePath)) {
            d('* Replacing existing file');
            await fs.remove(cachePath);
        }
        await fs.move(currentPath, cachePath);
        return cachePath;
    }
}
exports.Cache = Cache;
//# sourceMappingURL=Cache.js.map