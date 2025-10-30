"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const AuthRoute_1 = __importDefault(require("./routes/AuthRoute"));
const EmployeeRoute_1 = __importDefault(require("./routes/EmployeeRoute"));
const LaborEventsRoute_1 = __importDefault(require("./routes/LaborEventsRoute"));
const DeductionsRoute_1 = __importDefault(require("./routes/DeductionsRoute"));
const EmployeeDeductionsRoute_1 = __importDefault(require("./routes/EmployeeDeductionsRoute"));
const PayrollTypeRoute_1 = __importDefault(require("./routes/PayrollTypeRoute"));
const PayrollRoutes_1 = __importDefault(require("./routes/PayrollRoutes"));
const ClockLogsRoute_1 = __importDefault(require("./routes/ClockLogsRoute"));
const BonusesRoute_1 = __importDefault(require("./routes/BonusesRoute"));
const NomineeRoute_1 = __importDefault(require("./routes/NomineeRoute"));
const PositionRoute_1 = __importDefault(require("./routes/PositionRoute"));
const VacationRoute_1 = __importDefault(require("./routes/VacationRoute"));
const AuditLogsRoute_1 = __importDefault(require("./routes/AuditLogsRoute"));
const docs_1 = require("./utils/docs");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
// Middlewares básicos
app.use((0, cors_1.default)());
app.use(express_1.default.json());
console.log("Servidor en ejecución...");
// Solo rutas básicas sin importar nada más
app.get("/", (_req, res) => {
    console.log("Ruta raíz accesada");
    res.json({
        success: true,
        message: "API de VP Planillas funcionando 🚀",
    });
});
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "Servidor funcionando correctamente",
    });
});
// Ruta de auth básica sin importaciones externas
app.use("/api", AuthRoute_1.default);
app.use("/api", EmployeeRoute_1.default);
app.use("/api", LaborEventsRoute_1.default);
app.use("/api", DeductionsRoute_1.default);
app.use("/api", EmployeeDeductionsRoute_1.default);
app.use("/api", PayrollTypeRoute_1.default);
app.use("/api", PayrollRoutes_1.default);
app.use("/api", ClockLogsRoute_1.default);
app.use("/api", BonusesRoute_1.default);
app.use("/api", NomineeRoute_1.default);
app.use("/api", PositionRoute_1.default);
app.use("/api", VacationRoute_1.default);
app.use("/api", AuditLogsRoute_1.default);
// Servir la especificación de Swagger en formato JSON
app.get("/api/docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(docs_1.swaggerSpec);
});
// ESM-only package: load dynamically to work under CommonJS runtime
app.use("/api/docs", async (req, res, next) => {
    try {
        const { apiReference } = await import("@scalar/express-api-reference");
        const mw = apiReference({ url: "/api/docs/swagger.json" });
        return mw(req, res, next);
    }
    catch (e) {
        console.error("Failed to load API reference UI:", e);
        res.status(500).json({ success: false, message: "Docs UI unavailable" });
    }
});
app.listen(PORT, "0.0.0.0", () => {
    console.log(`🌐 Servidor escuchando en http://0.0.0.0:${PORT}`);
});
exports.default = app;
