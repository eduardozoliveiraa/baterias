import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();

    const { tag, modelo, tipoBateria, tensoes, flutuacoes, equalizacao } = requestBody;

    const existingBateria = await prisma.bateria.findUnique({
      where: {
        tag_modelo: {
          tag,
          modelo
        }
      }
    });

    console.log('Existing battery:', existingBateria);

    if (existingBateria) {
      return NextResponse.json({ message: 'Já existe uma bateria com esta tag e modelo.' }, { status: 409 });
    }

    console.log('Creating new battery');
    const newBateria = await prisma.bateria.create({
      data: {
        tag,
        modelo,
        tipoBateria,
        tensoes: JSON.stringify(tensoes),
        flutuacoes: JSON.stringify(flutuacoes),
        equalizacao
      }
    });

    console.log('New battery created:', newBateria);

    return NextResponse.json(newBateria, { status: 200 });
  } catch (error) {
    console.error('Error in POST handler:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Erro ao registrar a bateria.', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro desconhecido ao registrar a bateria.' }, { status: 500 });
  }
}
