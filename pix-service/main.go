package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"os"
	"sync"
	"time"

	"github.com/Shopify/sarama"
	pb "pix-service/proto"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type server struct {
	pb.UnimplementedPixServiceServer
	kafkaProducer sarama.SyncProducer
	topic         string
	transactions  map[string]*Transaction
	mu            sync.RWMutex
}

type Transaction struct {
	ID          string    `json:"id"`
	FromAccount string    `json:"from_account"`
	ToAccount   string    `json:"to_account"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"created_at"`
	Error       string    `json:"error,omitempty"`
}

func (s *server) ProcessPix(ctx context.Context, req *pb.ProcessPixRequest) (*pb.ProcessPixResponse, error) {
	// Criar transação
	transaction := Transaction{
		ID:          fmt.Sprintf("PIX-%d", time.Now().UnixNano()),
		FromAccount: req.FromAccount,
		ToAccount:   req.ToAccount,
		Amount:      req.Amount,
		Description: req.Description,
		Status:      "PENDING",
		CreatedAt:   time.Now(),
	}

	// Validar transação
	if req.Amount <= 0 {
		return nil, status.Error(codes.InvalidArgument, "amount must be greater than zero")
	}

	// Serializar transação
	value, err := json.Marshal(transaction)
	if err != nil {
		return nil, status.Error(codes.Internal, "failed to serialize transaction")
	}

	// Enviar para o Kafka
	msg := &sarama.ProducerMessage{
		Topic: s.topic,
		Key:   sarama.StringEncoder(transaction.ID),
		Value: sarama.StringEncoder(value),
	}

	partition, offset, err := s.kafkaProducer.SendMessage(msg)
	if err != nil {
		log.Printf("Failed to send message to Kafka: %v", err)
		return nil, status.Error(codes.Internal, "failed to process transaction")
	}

	log.Printf("Message sent to partition %d at offset %d", partition, offset)

	// Armazenar transação
	s.mu.Lock()
	s.transactions[transaction.ID] = &transaction
	s.mu.Unlock()

	return &pb.ProcessPixResponse{
		TransactionId: transaction.ID,
		Status:       transaction.Status,
	}, nil
}

func (s *server) GetTransactionStatus(ctx context.Context, req *pb.GetTransactionStatusRequest) (*pb.GetTransactionStatusResponse, error) {
	s.mu.RLock()
	transaction, exists := s.transactions[req.TransactionId]
	s.mu.RUnlock()

	if !exists {
		return nil, status.Error(codes.NotFound, "transaction not found")
	}

	return &pb.GetTransactionStatusResponse{
		TransactionId: transaction.ID,
		Status:       transaction.Status,
		FromAccount:  transaction.FromAccount,
		ToAccount:    transaction.ToAccount,
		Amount:       transaction.Amount,
		Description:  transaction.Description,
		CreatedAt:    transaction.CreatedAt.Format(time.RFC3339),
		ErrorMessage: transaction.Error,
	}, nil
}

func main() {
	// Configurar Kafka
	kafkaBrokers := os.Getenv("KAFKA_BROKERS")
	if kafkaBrokers == "" {
		kafkaBrokers = "localhost:9092"
	}

	config := sarama.NewConfig()
	config.Producer.Return.Successes = true
	config.Producer.Return.Errors = true

	producer, err := sarama.NewSyncProducer([]string{kafkaBrokers}, config)
	if err != nil {
		log.Fatalf("Failed to connect to Kafka: %v", err)
	}
	defer producer.Close()

	// Criar servidor gRPC
	lis, err := net.Listen("tcp", ":50051")
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	s := grpc.NewServer()
	pb.RegisterPixServiceServer(s, &server{
		kafkaProducer: producer,
		topic:        "pix-transactions",
		transactions:  make(map[string]*Transaction),
	})

	log.Printf("Server listening at %v", lis.Addr())
	if err := s.Serve(lis); err != nil {
		log.Fatalf("Failed to serve: %v", err)
	}
} 