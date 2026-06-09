import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 获取过滤器和拦截器实例
  const httpExceptionFilter = app.get(HttpExceptionFilter);
  const transformInterceptor = app.get(TransformInterceptor);
  const reflector = app.get(Reflector);
  
  // 全局注册管道、过滤器和拦截器
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(httpExceptionFilter);
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    transformInterceptor,
  );
  
  console.log('Application starting...');
  await app.listen(3000);
  console.log('Application started successfully on port 3000');
}
bootstrap();
