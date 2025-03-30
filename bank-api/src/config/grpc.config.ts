import { join } from 'path';
import { Transport } from '@nestjs/microservices';

const rootDir = join(__dirname, '../..'); // Ajuste conforme sua estrutura

export const pixGrpcOptions = {
  transport: Transport.GRPC,
  options: {
    package: 'pix',
    protoPath: join(rootDir, 'proto/pix.proto'),
    url: '0.0.0.0:50051',
    loader: {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
    },
  },
};