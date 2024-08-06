"use client";
import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from 'next/navigation';
import Header from "../Header/header";

const UpdateTensoes = () => {
  const [tag, setTag] = useState("");
  const [modelo, setModelo] = useState("");
  const [tensoes, setTensoes] = useState<{ valor: string; flutuacao: number }[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error" | null>(null);

  const router = useRouter();

  const fetchTensoes = async () => {
    try {
      const response = await fetch(`/api/getTensoes?tag=${tag}&modelo=${modelo}`);
      if (response.ok) {
        const data = await response.json();
        setTensoes(data.tensoes);
      } else {
        setMessageType("error");
        setMessage("Erro ao buscar os dados da bateria.");
      }
    } catch (error) {
      setMessageType("error");
      if (error instanceof Error)
        setMessage("Erro ao buscar os dados da bateria: " + error.message);
    }
  };

  const handleTensaoChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value.replace(",", ".");
    const newTensoes = [...tensoes];
    const flutuacao = parseFloat(newValue) * 2.2;
    newTensoes[index] = {
      valor: newValue,
      flutuacao: isNaN(flutuacao) ? 0 : flutuacao,
    };
    setTensoes(newTensoes);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const updatedTensoes = tensoes.map((t) => ({ valor: t.valor, flutuacao: t.flutuacao }));

    try {
      const response = await fetch("/api/updateTensoes", {
        method: "POST",
        mode: "cors",
        body: JSON.stringify({ tag, modelo, tensoes: updatedTensoes }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setMessageType("success");
        setMessage("Tensões atualizadas com sucesso!");
      } else {
        setMessageType("error");
        setMessage("Erro ao atualizar as tensões.");
      }
    } catch (error) {
      setMessageType("error");
      if (error instanceof Error)
        setMessage("Erro ao atualizar as tensões: " + error.message);
    }
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen">
      <Header />
      <div className="max-w-4xl mx-auto p-4">
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
          <button
            type="button"
            className="bg-blue-500 p-2 rounded text-gray-100"
            onClick={fetchTensoes}
          >
            Buscar Tensões
          </button>
          {tensoes.length > 0 && (
            <>
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
                className="bg-green-500 p-2 rounded text-gray-100"
                type="submit"
              >
                Atualizar Tensões
              </button>
            </>
          )}
        </form>
        {message && (
          <div
            className={`mt-4 p-2 rounded ${messageType === "success" ? "bg-green-500" : "bg-red-500"
              } text-gray-100`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateTensoes;
