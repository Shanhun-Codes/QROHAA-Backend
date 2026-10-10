"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('QROHAA API')
        .setDescription('QR Open House Agent API')
        .setVersion('1.0')
        .build();
    const swaggerDocument = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('api', app, swaggerDocument);
    const configService = app.get(config_1.ConfigService);
    const frontendUrls = (configService.get('FRONTEND_URLS') ?? '')
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean);
    app.enableCors({
        origin: frontendUrls,
    });
    app.useGlobalPipes(new common_1.ValidationPipe());
    await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
//# sourceMappingURL=main.js.map