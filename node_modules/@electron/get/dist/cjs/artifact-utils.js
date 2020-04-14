"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const BASE_URL = 'https://github.com/electron/electron/releases/download/';
const NIGHTLY_BASE_URL = 'https://github.com/electron/nightlies/releases/download/';
function getArtifactFileName(details) {
    utils_1.ensureIsTruthyString(details, 'artifactName');
    if (details.isGeneric) {
        return details.artifactName;
    }
    utils_1.ensureIsTruthyString(details, 'arch');
    utils_1.ensureIsTruthyString(details, 'platform');
    utils_1.ensureIsTruthyString(details, 'version');
    return `${[
        details.artifactName,
        details.version,
        details.platform,
        details.arch,
        ...(details.artifactSuffix ? [details.artifactSuffix] : []),
    ].join('-')}.zip`;
}
exports.getArtifactFileName = getArtifactFileName;
function mirrorVar(name, options, defaultValue) {
    // Convert camelCase to camel_case for env var reading
    const lowerName = name.replace(/([a-z])([A-Z])/g, (_, a, b) => `${a}_${b}`).toLowerCase();
    return (process.env[`NPM_CONFIG_ELECTRON_${lowerName.toUpperCase()}`] ||
        process.env[`npm_config_electron_${lowerName}`] ||
        process.env[`npm_package_config_electron_${lowerName}`] ||
        process.env[`ELECTRON_${lowerName.toUpperCase()}`] ||
        options[name] ||
        defaultValue);
}
function getArtifactRemoteURL(details) {
    const opts = details.mirrorOptions || {};
    let base = mirrorVar('mirror', opts, BASE_URL);
    if (details.version.includes('nightly')) {
        base = mirrorVar('nightly_mirror', opts, NIGHTLY_BASE_URL);
    }
    const path = mirrorVar('customDir', opts, details.version).replace('{{ version }}', details.version.replace(/^v/, ''));
    const file = mirrorVar('customFilename', opts, getArtifactFileName(details));
    return `${base}${path}/${file}`;
}
exports.getArtifactRemoteURL = getArtifactRemoteURL;
//# sourceMappingURL=artifact-utils.js.map