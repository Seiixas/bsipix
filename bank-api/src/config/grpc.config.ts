export const pixGrpcOptions = {
  transport: 0,
  options: {
    url: process.env.PIX_SERVICE_ADDR || 'localhost:50051',
    package: 'pix',
    protoPath: '/app/proto/pix.proto',
  },
};

export const PIX_SERVICE_NAME = 'PixService';