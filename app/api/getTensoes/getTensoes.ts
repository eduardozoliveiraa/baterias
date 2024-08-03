import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  const { tag, modelo } = req.query;

  if (!tag || !modelo) {
    return res.status(400).json({ message: 'Tag e modelo são obrigatórios' });
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

    res.status(200).json({ tensoes: bateria.tensoes });
  } catch (error) {
    if (error instanceof Error)

    res.status(500).json({ message: 'Erro ao buscar dados da bateria', error: error.message });
  }
}
