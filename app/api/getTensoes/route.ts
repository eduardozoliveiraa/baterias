import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get('tag');
  const modelo = searchParams.get('modelo');

  if (!tag || !modelo) {
    return NextResponse.json({ message: 'Tag e modelo são obrigatórios' }, { status: 400 });
  }

  try {
    const bateria = await prisma.bateria.findUnique({
      where: {
        tag_modelo: {
          tag: String(tag),
          modelo: String(modelo),
        },
      },
    });

    if (!bateria) {
      return NextResponse.json({ message: 'Bateria não encontrada' }, { status: 404 });
    }

    const tensoes = bateria.tensoes ? (typeof bateria.tensoes === 'string' ? JSON.parse(bateria.tensoes) : bateria.tensoes) : [];
    return NextResponse.json({ tensoes }, { status: 200 });
  } catch (error) {
    console.error('Erro ao buscar dados da bateria:', error);
    if (error instanceof Error) {
      return NextResponse.json({ message: 'Erro ao buscar dados da bateria', error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Erro desconhecido ao buscar dados da bateria' }, { status: 500 });
  }
}
