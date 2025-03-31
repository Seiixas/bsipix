package consumer

import (
	"encoding/json"
	"log"
	"os"
	"os/signal"
	"sync"

	"github.com/Shopify/sarama"
)

type Transaction struct {
	ID          string    `json:"id"`
	FromAccount string    `json:"from_account"`
	ToAccount   string    `json:"to_account"`
	Amount      float64   `json:"amount"`
	Description string    `json:"description"`
	Status      string    `json:"status"`
	Error       string    `json:"error,omitempty"`
}

type TransactionProcessor struct {
	consumer sarama.Consumer
	topic    string
	ready    chan bool
}

func NewTransactionProcessor(brokers []string, topic string) (*TransactionProcessor, error) {
	config := sarama.NewConfig()
	config.Consumer.Group.Rebalance.Strategy = sarama.BalanceStrategyRoundRobin
	config.Consumer.Offsets.Initial = sarama.OffsetOldest

	consumer, err := sarama.NewConsumer(brokers, config)
	if err != nil {
		return nil, err
	}

	return &TransactionProcessor{
		consumer: consumer,
		topic:    topic,
		ready:    make(chan bool),
	}, nil
}

func (p *TransactionProcessor) Start() error {
	partitions, err := p.consumer.Partitions(p.topic)
	if err != nil {
		return err
	}

	var wg sync.WaitGroup
	for _, partition := range partitions {
		pc, err := p.consumer.ConsumePartition(p.topic, partition, sarama.OffsetNewest)
		if err != nil {
			return err
		}

		wg.Add(1)
		go func(pc sarama.PartitionConsumer) {
			defer wg.Done()
			for msg := range pc.Messages() {
				var transaction Transaction
				if err := json.Unmarshal(msg.Value, &transaction); err != nil {
					log.Printf("Error unmarshaling transaction: %v", err)
					continue
				}

				// Processar a transação
				p.processTransaction(&transaction)

				// TODO: Atualizar o status da transação no banco de dados
			}
		}(pc)
	}

	// Aguardar sinal de interrupção
	sigterm := make(chan os.Signal, 1)
	signal.Notify(sigterm, os.Interrupt)
	<-sigterm

	// Fechar o consumidor graciosamente
	if err := p.consumer.Close(); err != nil {
		log.Printf("Error closing consumer: %v", err)
	}

	wg.Wait()
	return nil
}

func (p *TransactionProcessor) processTransaction(transaction *Transaction) {
	log.Printf("Processing transaction %s: %f from %s to %s", 
		transaction.ID, 
		transaction.Amount, 
		transaction.FromAccount, 
		transaction.ToAccount,
	)

	// Simular processamento
	// TODO: Implementar lógica real de processamento
	transaction.Status = "COMPLETED"
} 