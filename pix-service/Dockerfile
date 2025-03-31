FROM golang:1.21-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache protobuf-dev

# Instalar plugins do protoc
RUN go install google.golang.org/protobuf/cmd/protoc-gen-go@v1.33.0
RUN go install google.golang.org/grpc/cmd/protoc-gen-go-grpc@v1.3.0

# Copiar todo o código
COPY . .

# Gerar arquivos protobuf
RUN protoc --go_out=. --go_opt=paths=source_relative \
    --go-grpc_out=. --go-grpc_opt=paths=source_relative \
    proto/pix.proto

# Baixar dependências e compilar
RUN go mod tidy && go build -o main .

EXPOSE 50051

CMD ["./main"] 