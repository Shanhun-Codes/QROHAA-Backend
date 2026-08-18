import { Module } from '@nestjs/common';
import { TestService } from './test.service';
import { TestController } from './test.controller';
import { AppModule } from 'src/app.module';

@Module({
  controllers: [TestController],
  providers: [TestService]
})
export class TestModule {}
