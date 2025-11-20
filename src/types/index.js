"use strict";
/**
 * Core Type Definitions
 * Shared types across the application
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerpetuaError = exports.DEFAULT_SETTINGS = void 0;
exports.isStageType = isStageType;
exports.isJourneyStatus = isJourneyStatus;
exports.isArtifactType = isArtifactType;
/**
 * Default settings
 */
exports.DEFAULT_SETTINGS = {
    autoContinue: true,
    maxStages: 50,
    stageDelay: 2000,
    extendedThinking: true,
    computerUse: true,
};
/**
 * Error types
 */
class PerpetuaError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'PerpetuaError';
    }
}
exports.PerpetuaError = PerpetuaError;
/**
 * Type guards
 */
function isStageType(value) {
    return [
        'discovering',
        'chasing',
        'solving',
        'challenging',
        'questioning',
        'searching',
        'imagining',
        'building',
    ].includes(value);
}
function isJourneyStatus(value) {
    return ['running', 'paused', 'stopped', 'complete', 'error'].includes(value);
}
function isArtifactType(value) {
    return ['document', 'code', 'visualization', 'mindmap', 'other'].includes(value);
}
//# sourceMappingURL=index.js.map