
export type AppStateV1T = {
    key: string;
    version: number;
    isSidePanelOpen: boolean;
    libraryRootPath: string;
    downloadBatchSize?: number;     // Removed
    downloadBatchDelay?: number;    // Removed
}