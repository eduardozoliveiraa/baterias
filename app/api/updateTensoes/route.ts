import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function POST(req: NextRequest) {
  const { tag, modelo, tensoes } = await req.json();

  if (!tag || !modelo || !tensoes) {
    return NextResponse.json({ message: 'Tag, modelo e tensões são obrigatórios' }, { status: 400 });
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

    await prisma.bateria.update({
      where: {
        tag_modelo: {
          tag: String(tag),
          modelo: String(modelo),
        },
      },
      data: {
        tensoes: tensoes,
      },
    });

    return NextResponse.json({ message: 'Tensões atualizadas com sucesso' }, { status: 200 });
  } catch (error) {
    if (error instanceof Error)
      return NextResponse.json({ message: 'Erro ao atualizar tensões da bateria', error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Erro desconhecido ao atualizar tensões da bateria' }, { status: 500 });
  }
}
