"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import jsPDF from "jspdf";
import Header from "./pages/Header/header";
import { useRouter } from 'next/navigation';

const tiposBateria = [
  "Bateria Chumbo Ventilado",
  "Bateria Chumbo Válvula",
  "Alcalina",
];

const Baterias = () => {
  const [tag, setTag] = useState("");
  const [modelo, setModelo] = useState("");
  const [tipoBateria, setTipoBateria] = useState("");
  const [quantidadeTensoes, setQuantidadeTensoes] = useState(0);
  const [tensoes, setTensoes] = useState<{ valor: string; flutuacao: number }[]>([]);
  const [equalizacao, setEqualizacao] = useState<boolean>(false);
  const [media, setMedia] = useState<number | null>(null);
  const [desvios, setDesvios] = useState<number[]>([]);
  const [tensoesDesviadas, setTensoesDesviadas] = useState<
    { id: string; valor: string; desvio: number }[]
  >([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(
    null
  );

  const router = useRouter();

  const handleQuantidadeTensoesChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const quantidade = parseInt(event.target.value, 10);
    setQuantidadeTensoes(quantidade);
    setTensoes(new Array(quantidade).fill({ valor: "", flutuacao: 0 }));
  };

  const handleTensaoChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.value.replace(",", ".");
    const newTensoes = [...tensoes];
    const flutuacao = parseFloat(newValue) * 2.2;
    newTensoes[index] = {
      valor: newValue,
      flutuacao: isNaN(flutuacao) ? 0 : flutuacao,
    };
    setTensoes(newTensoes);

    const tensoesValores = newTensoes.map((t) => parseFloat(t.valor));
    const media =
      tensoesValores.reduce((acc, val) => acc + val, 0) / tensoesValores.length;
    const desvios = tensoesValores.map((val) => Math.abs(val - media));
    const elementosComDesvio = desvios.filter((dev) => dev > 0.04).length;

    const tensoesDesviadas = newTensoes
      .filter((t, i) => desvios[i] > 0.04)
      .map((t, i) => ({
        id: `tensao_${i + 1}`,
        valor: t.valor,
        desvio: desvios[i],
      }));

    setMedia(media);
    setDesvios(desvios);
    setTensoesDesviadas(tensoesDesviadas);
    setEqualizacao(
      elementosComDesvio >= Math.ceil(0.1 * tensoesValores.length)
    );
  };

  const handleTipoBateriaChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setTipoBateria(event.target.value);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const tensoesPreenchidas = tensoes.every(t => t.valor !== "");
    if (!tag || !modelo || !tipoBateria || !quantidadeTensoes || !tensoesPreenchidas) {
      setMessageType("error");
      setMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    const bateriaData = {
      tag,
      modelo,
      tipoBateria,
      tensoes: tensoes.map((t) => ({ valor: t.valor, flutuacao: t.flutuacao })),
      flutuacoes: tensoes.map((t) => t.flutuacao),
      equalizacao,
    };

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(bateriaData),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessageType("success");
        setMessage("Dados da bateria enviados com sucesso!");
      } else if (response.status === 409) {
        setMessageType("error");
        setMessage("Já existe uma bateria com esta tag e modelo.");
      } else {
        setMessageType("error");
        setMessage("Erro ao enviar os dados da bateria.");
      }
    } catch (error) {
      setMessageType("error");
      if (error instanceof Error)
        setMessage("Erro ao enviar os dados da bateria: " + error.message);
    }
  };

  const generatePDF = () => {
    const pdf = new jsPDF();
  
    // Cabeçalho
    pdf.setFontSize(10);
    pdf.text("DATA:", 150, 20);
    pdf.text("ANEXO A - REGISTRO DE INSPEÇÃO E", 30, 20);
    pdf.text("MANUTENÇÃO TRIMESTRAL EM BATERIAS DE", 30, 26);
    pdf.text("ACUMULADORES CHUMBO-ÁCIDOS", 30, 32);
    pdf.text("Nº ORDEM:", 150, 30);
    pdf.text("Executantes:", 20, 50);
  
    const checklist = [
      "1. Trincas, Vazamentos ou Estufamentos: ( ) NÃO  ( ) SIM  descrever:",
      "2. Válvulas de segurança (quebras, entupimentos, borracha de vedação danificada):",
      "   ( ) NÃO  ( ) SIM  descrever:",
      "3. Estado das tampas:  ( ) OK  ( ) Problemas:",
      "4. Oxidação nos pólos e/ou interligações:  ( ) NÃO  ( ) SIM  descrever:",
      "5. Condições de limpeza (sala / estante / elementos):  ( ) OK  ( ) Problemas:",
      "   5.1. Realizada limpeza dos elementos e da estante: ( ) SIM  ( ) NÃO",
      "6. Excesso de gaseificação/sedimentação: ( ) NÃO  ( ) SIM  descrever:",
      "7. Condições dos suportes, do seu aterramento e dos pés isoladores: ( ) OK  ( ) Problemas:",
      "8. Sistema de exaustão instalado e operando: ( ) SIM  ( ) NÃO  Descrever:",
    ];
  
    pdf.setFontSize(8);
    checklist.forEach((item, index) => {
      pdf.text(item, 20, 55 + index * 5);
    });
  
    pdf.setFontSize(10);
    pdf.text(`Tag da Bateria: ${tag}`, 20, 110);
    pdf.text(`Modelo da Bateria: ${modelo}`, 20, 115);
    pdf.text(`Tipo da Bateria: ${tipoBateria}`, 20, 120);
  
    if (equalizacao) {
      pdf.text("Necessidade de carga de equalização!", 20, 126);
    }
  
    pdf.setFontSize(10);
    pdf.text("Tensões dos Elementos:", 20, 133);
  
    // Tabela de tensões
    const startX = 20;
    const startY = 140;
    const colWidth = 30; // Largura de cada coluna
    const rowHeight = 10;
    const numCols = 6; // Número de colunas que deseja exibir
  
    // Desenha a tabela com várias colunas
    for (let i = 0; i < quantidadeTensoes; i++) {
      const rowIndex = Math.floor(i / numCols);
      const colIndex = i % numCols;
      const xPos = startX + colIndex * colWidth;
      const yPos = startY + rowIndex * rowHeight;
  
      pdf.rect(xPos, yPos, colWidth, rowHeight);
  
      pdf.text(`Tensão ${i + 1}: ${tensoes[i]?.valor || ''}`, xPos + 5, yPos + rowHeight - 3);
    }
  
    pdf.save(`relatorio_bateria_${tag}_${modelo}.pdf`);
  };
  
  

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-center items-center mb-6">
          <label htmlFor="tipoBateria" className="mr-2 text-gray-100">
            Escolha o tipo de bateria:
          </label>
          <select
            className="bg-gray-700 p-2 rounded text-gray-100"
            id="tipoBateria"
            value={tipoBateria}
            onChange={handleTipoBateriaChange}
          >
            <option value="">Selecione...</option>
            {tiposBateria.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>
        {tipoBateria && (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="tag" className="block text-gray-100">
                  Tag da Bateria:
                </label>
                <input
                  className="bg-gray-700 p-2 rounded w-full text-gray-100"
                  type="text"
                  id="tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="modelo" className="block text-gray-100">
                  Modelo da Bateria:
                </label>
                <input
                  className="bg-gray-700 p-2 rounded w-full text-gray-100"
                  type="text"
                  id="modelo"
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="quantidadeTensoes" className="block text-gray-100">
                  Quantidade de Tensões:
                </label>
                <input
                  className="bg-gray-700 p-2 rounded w-full text-gray-100"
                  type="number"
                  id="quantidadeTensoes"
                  value={quantidadeTensoes}
                  onChange={handleQuantidadeTensoesChange}
                />
              </div>
              {tensoes.map((t, index) => (
                <div key={index}>
                  <label htmlFor={`tensao_${index}`} className="block text-gray-100">
                    Tensão {index + 1}:
                  </label>
                  <input
                    className="bg-gray-700 p-2 rounded w-full text-gray-100"
                    type="text"
                    id={`tensao_${index}`}
                    value={t.valor}
                    onChange={(e) => handleTensaoChange(index, e)}
                  />
                </div>
              ))}
              <button
                className="bg-green-500 p-2 rounded w-full text-gray-100"
                type="submit"
              >
                Enviar Dados da Bateria
              </button>
            </form>
            {message && (
              <div
                className={`mt-4 p-2 rounded ${messageType === "success" ? "bg-green-500" : "bg-red-500"
                  } text-gray-100`}
              >
                {message}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <button
                className="bg-blue-500 p-2 rounded text-gray-100"
                onClick={generatePDF}
              >
                Gerar Relatório PDF
              </button>
              <button
                className="bg-yellow-500 p-2 rounded text-gray-100"
                onClick={() => router.push('pages/updateTensoes')}
              >
                Atualizar Tensões
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Baterias;
