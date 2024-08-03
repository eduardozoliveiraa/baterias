import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { tag, modelo, tensoes } = req.body;

  if (!tag || !modelo || !tensoes) {
    return res.status(400).json({ message: 'Tag, modelo e tensões são obrigatórios' });
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
      return res.status(404).json({ message: 'Bateria não encontrada' });
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

    res.status(200).json({ message: 'Tensões atualizadas com sucesso' });
  } catch (error) {
    if (error instanceof Error)
    res.status(500).json({ message: 'Erro ao atualizar tensões da bateria', error: error.message });
  }
}
