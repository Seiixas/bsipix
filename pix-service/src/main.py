import grpc
from concurrent import futures
import time
import json
import kafka
from datetime import datetime
import os
import sys
import logging
import requests
from requests.exceptions import RequestException

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('pix_service')

# Adicionar o diretório atual ao PYTHONPATH
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Importar os módulos gerados do proto
from pix_pb2 import (
    PixRequest,
    PixResponse,
    StatusRequest,
    StatusResponse
)
import pix_pb2_grpc

class Transaction:
    def __init__(self, id, from_account, to_account, amount, description):
        self.id = id
        self.from_account = from_account
        self.to_account = to_account
        self.amount = amount
        self.description = description
        self.status = "pending"
        self.created_at = datetime.now().isoformat()
        self.error = None

class PixService(pix_pb2_grpc.PixServiceServicer):
    def __init__(self):
        logger.info("Inicializando serviço PIX...")
        self.transactions = {}
        self.bank_api_url = os.getenv('BANK_API_URL', 'http://bank-api:3000')
        self._init_kafka()
        self._wait_for_bank_api()

    def _init_kafka(self):
        try:
            kafka_brokers = os.getenv('KAFKA_BROKERS', 'kafka:29092')
            logger.info(f"Conectando ao Kafka em {kafka_brokers}")
            self.kafka_producer = kafka.KafkaProducer(
                bootstrap_servers=[kafka_brokers],
                value_serializer=lambda v: json.dumps(v).encode('utf-8')
            )
            logger.info("Conexão com Kafka estabelecida com sucesso")
        except Exception as e:
            logger.error(f"Erro ao conectar ao Kafka: {str(e)}")
            raise

    def _wait_for_bank_api(self):
        max_retries = 5
        retry_delay = 5
        for attempt in range(max_retries):
            try:
                logger.info(f"Tentando conectar à API do banco em {self.bank_api_url} (tentativa {attempt + 1}/{max_retries})")
                response = requests.get(f"{self.bank_api_url}/health")
                if response.status_code == 200:
                    logger.info("Conexão com a API do banco estabelecida com sucesso")
                    return
            except RequestException as e:
                logger.warning(f"Erro ao conectar à API do banco: {str(e)}")
                if attempt < max_retries - 1:
                    logger.info(f"Aguardando {retry_delay} segundos antes da próxima tentativa...")
                    time.sleep(retry_delay)
                else:
                    logger.error("Não foi possível conectar à API do banco após várias tentativas")
                    raise

    def _transfer_money(self, from_account, to_account, amount):
        """Realiza a transferência de dinheiro entre contas"""
        try:
            # Verificar saldo da conta de origem
            response = requests.get(f"{self.bank_api_url}/accounts/{from_account}")
            if response.status_code != 200:
                raise Exception(f"Conta de origem não encontrada: {from_account}")
            
            from_account_data = response.json()
            if from_account_data['balance'] < amount:
                raise Exception(f"Saldo insuficiente na conta de origem: {from_account}")

            # Realizar a transferência
            transfer_data = {
                "from_account": from_account,
                "to_account": to_account,
                "amount": amount
            }
            
            response = requests.post(
                f"{self.bank_api_url}/accounts/transfer",
                json=transfer_data
            )
            
            if response.status_code != 200:
                raise Exception(f"Erro ao realizar transferência: {response.text}")
            
            return response.json()
        except Exception as e:
            logger.error(f"Erro na transferência: {str(e)}")
            raise

    def ProcessPix(self, request, context):
        logger.info(f"Recebida requisição de PIX: {request}")
        try:
            # Validar o valor da transação
            if request.amount <= 0:
                logger.warning(f"Valor inválido recebido: {request.amount}")
                context.set_code(grpc.StatusCode.INVALID_ARGUMENT)
                context.set_details('O valor da transação deve ser maior que zero')
                return PixResponse()

            # Criar ID único para a transação
            transaction_id = f"PIX_{int(time.time())}_{request.from_account[:4]}"
            logger.info(f"Criada transação com ID: {transaction_id}")

            # Criar objeto de transação
            transaction = Transaction(
                id=transaction_id,
                from_account=request.from_account,
                to_account=request.to_account,
                amount=request.amount,
                description=request.description
            )

            # Realizar a transferência
            try:
                logger.info(f"Iniciando transferência de {request.amount} da conta {request.from_account} para {request.to_account}")
                transfer_result = self._transfer_money(
                    request.from_account,
                    request.to_account,
                    request.amount
                )
                transaction.status = "completed"
                logger.info(f"Transferência realizada com sucesso: {transfer_result}")
            except Exception as e:
                transaction.status = "failed"
                transaction.error = str(e)
                logger.error(f"Erro na transferência: {str(e)}")
                context.set_code(grpc.StatusCode.INTERNAL)
                context.set_details(f'Erro na transferência: {str(e)}')
                return PixResponse(
                    transaction_id=transaction_id,
                    status=transaction.status,
                    error=transaction.error
                )

            # Enviar para o Kafka
            try:
                logger.info(f"Enviando transação {transaction_id} para o Kafka")
                self.kafka_producer.send('pix_transactions', {
                    'transaction_id': transaction_id,
                    'from_account': request.from_account,
                    'to_account': request.to_account,
                    'amount': request.amount,
                    'description': request.description,
                    'status': transaction.status,
                    'created_at': transaction.created_at
                })
                logger.info(f"Transação {transaction_id} enviada para o Kafka com sucesso")
            except Exception as e:
                logger.error(f"Erro ao enviar para o Kafka: {str(e)}")
                raise

            # Armazenar em memória
            self.transactions[transaction_id] = transaction
            logger.info(f"Transação {transaction_id} armazenada em memória")

            return PixResponse(
                transaction_id=transaction_id,
                status=transaction.status
            )

        except Exception as e:
            logger.error(f"Erro ao processar PIX: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f'Erro ao processar PIX: {str(e)}')
            return PixResponse()

    def GetTransactionStatus(self, request, context):
        logger.info(f"Consultando status da transação: {request.transaction_id}")
        try:
            transaction = self.transactions.get(request.transaction_id)
            if not transaction:
                logger.warning(f"Transação não encontrada: {request.transaction_id}")
                context.set_code(grpc.StatusCode.NOT_FOUND)
                context.set_details('Transação não encontrada')
                return StatusResponse()

            logger.info(f"Status da transação {request.transaction_id}: {transaction.status}")
            return StatusResponse(
                transaction_id=transaction.id,
                from_account=transaction.from_account,
                to_account=transaction.to_account,
                amount=transaction.amount,
                description=transaction.description,
                status=transaction.status,
                error=transaction.error or '',
                created_at=transaction.created_at
            )

        except Exception as e:
            logger.error(f"Erro ao consultar status: {str(e)}")
            context.set_code(grpc.StatusCode.INTERNAL)
            context.set_details(f'Erro ao consultar status: {str(e)}')
            return StatusResponse()

def serve():
    logger.info("Iniciando servidor gRPC...")
    try:
        server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
        pix_pb2_grpc.add_PixServiceServicer_to_server(PixService(), server)
        server.add_insecure_port('[::]:50051')
        server.start()
        logger.info("Servidor gRPC iniciado com sucesso na porta 50051")
        server.wait_for_termination()
    except Exception as e:
        logger.error(f"Erro ao iniciar servidor: {str(e)}")
        raise

if __name__ == '__main__':
    try:
        serve()
    except KeyboardInterrupt:
        logger.info("Servidor encerrado pelo usuário")
    except Exception as e:
        logger.error(f"Erro fatal: {str(e)}")
        sys.exit(1) 