import { redirect } from "next/navigation";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import Heroi from "@/components/site/Heroi";
import Manifesto from "@/components/site/Manifesto";
import ComoFunciona from "@/components/site/ComoFunciona";
import ObrasDosCriadores from "@/components/site/ObrasDosCriadores";
import FaixaCriadores from "@/components/site/FaixaCriadores";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  // Links de criação antigos apontavam para a raiz — seguem funcionando.
  const { c } = await searchParams;
  if (c) redirect(`/configurador?c=${encodeURIComponent(c)}`);

  return (
    <div className="relative">
      <Header />
      <main>
        <Heroi />
        <Manifesto />
        <ComoFunciona />
        <ObrasDosCriadores />
        <FaixaCriadores />
      </main>
      <Footer />
    </div>
  );
}
