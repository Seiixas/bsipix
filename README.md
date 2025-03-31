# Sistema de Transações Pix Distribuído

Este projeto é um simulador de transações Pix entre contas bancárias fictícias, desenvolvido para demonstrar conceitos de sistemas distribuídos e resiliência.

## Arquitetura

O sistema é composto por três serviços principais:

1. **Bank API (NestJS)**
   - Gerencia contas bancárias
   - Expõe endpoints HTTP para operações bancárias
   - Comunica-se com o serviço Pix via gRPC
   - Usa SQLite como banco de dados

2. **Pix Service (Golang)**
   - Processa transações Pix
   - Implementa a lógica de transferência entre contas
   - Usa Kafka para garantir a resiliência das transações
   - Expõe interface gRPC

3. **Frontend (Next.js)**
   - Interface web para interação com o sistema
   - Permite criar contas e realizar transações Pix
   - Comunica-se com a Bank API via HTTP

## Tecnologias Utilizadas

- Node.js e TypeScript
- NestJS
- Next.js
- Golang
- gRPC
- Kafka
- SQLite
- Docker

## Requisitos

- Docker
- Docker Compose
- Node.js 18+
- Go 1.21+

## Como Executar

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/bsipix.git
cd bsipix
```

2. Inicie os serviços com Docker Compose:
```bash
docker-compose up --build
```

3. Acesse a aplicação:
- Frontend: http://localhost:3001
- Bank API: http://localhost:3000
- Pix Service (gRPC): localhost:50051

## Resiliência

O sistema implementa várias estratégias de resiliência:

1. **Persistência de Dados**
   - Transações são persistidas no banco de dados
   - Logs de transações são mantidos

2. **Mensageria Assíncrona**
   - Uso do Kafka para garantir a entrega de mensagens
   - Retry automático em caso de falhas
   - Dead letter queue para mensagens com falha

3. **Circuit Breaker**
   - Proteção contra falhas em cascata
   - Fallback para operações críticas

4. **Monitoramento**
   - Logs detalhados de transações
   - Métricas de performance
   - Alertas em caso de falhas

## Desenvolvimento

Para desenvolvimento local:

1. Bank API:
```bash
cd bank-api
npm install
npm run start:dev
```

2. Pix Service:
```bash
cd pix-service
go mod download
go run main.go
```

3. Frontend:
```bash
cd frontend
npm install
npm run dev
```

## Testes

Para executar os testes:

1. Bank API:
```bash
cd bank-api
npm test
```

2. Pix Service:
```bash
cd pix-service
go test ./...
```

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request 