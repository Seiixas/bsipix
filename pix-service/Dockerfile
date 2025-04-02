FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de requisitos
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar arquivos do projeto
COPY . .

# Gerar arquivos proto
RUN python -m grpc_tools.protoc \
    -I./proto \
    --python_out=. \
    --grpc_python_out=. \
    ./proto/pix.proto

# Criar diretório src se não existir
RUN mkdir -p src

# Mover arquivos gerados para o diretório src
RUN mv pix_pb2*.py src/

# Expor porta do gRPC
EXPOSE 50051

# Comando para executar o servidor
CMD ["python", "src/main.py"] 