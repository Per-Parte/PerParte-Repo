import type { Metadata } from "next";
import Montagem from "@/components/montagem/Montagem";

export const metadata: Metadata = {
  title: "Criar — Per Parte",
  description:
    "Monte a sua luminária empilhando e encostando formas — a gente imprime em 3D e entrega.",
};

export default function PaginaCriar() {
  return <Montagem />;
}
