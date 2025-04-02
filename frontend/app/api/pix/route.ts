import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Dados recebidos:', data);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pix/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from_account: data.from_account,
        to_account: data.to_account,
        amount: data.amount,
        description: data.description
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro da API:', error);
      return NextResponse.json({ error: error.message || 'Erro ao processar PIX' }, { status: response.status });
    }

    const result = await response.json();
    console.log('Resposta da API:', result);
    console.log('Campos disponíveis:', Object.keys(result));

    // Garantir que o ID da transação está presente
    if (!result.transaction_id) {
      console.error('ID da transação não encontrado na resposta:', result);
      return NextResponse.json({ error: 'ID da transação não recebido' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao processar PIX:', error);
    return NextResponse.json({ error: 'Erro ao processar PIX' }, { status: 500 });
  }
} 