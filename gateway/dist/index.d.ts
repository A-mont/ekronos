declare class Server {
    private app;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    private initializeVaraNetwork;
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
declare const server: Server;
export default server;
//# sourceMappingURL=index.d.ts.map