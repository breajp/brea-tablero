import { useState, type FormEvent } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Halos } from "@/components/ui/Halos";
import { Mark } from "@/components/ui/Mark";
import type { Tablero, Usuario } from "@/dominio/tipos";
import { useTituloDePagina } from "@/hooks/useTituloDePagina";
import { abrir, AccesoIncorrecto } from "@/lib/cifrado";
import { PRODUCTO } from "@/producto";

export function EntrarPage({ onEntrar }: { onEntrar: (a: { user: Usuario; data: Tablero }) => void }) {
  useTituloDePagina("Entrar");
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [error, setError] = useState<string>();

  async function entrar(e: FormEvent) {
    e.preventDefault();
    setEntrando(true);
    setError(undefined);
    try {
      onEntrar(await abrir(usuario, contrasena));
    } catch (err) {
      setError(err instanceof AccesoIncorrecto ? "El usuario o la contraseña no coinciden. Revisalos y probá de nuevo." : "No se pudo abrir el tablero en este navegador.");
      setEntrando(false);
    }
  }

  return (
    <main className="paper-grain grid min-h-screen bg-paper md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <section className="stage-grid relative flex flex-col justify-between overflow-hidden bg-stage px-6 py-10 text-stage-ink md:px-14 md:py-14">
        <Halos />
        <div className="relative flex items-center gap-3">
          <Mark size={34} />
          <span className="font-display text-[1.5rem] font-semibold leading-none tracking-[-.04em]">{PRODUCTO.nombre}</span>
        </div>
        <div className="relative mt-16 max-w-[30rem] md:mt-0">
          <h1 className="font-display text-h1 font-semibold tracking-[-.03em] md:text-display md:leading-(--text-display--line-height) md:tracking-(--text-display--letter-spacing)">
            Cómo viene la inmobiliaria, de un vistazo.
          </h1>
          <p className="mt-5 max-w-[46ch] text-lede text-stage-3">
            Producción, comisiones y cartera de Brea Propiedades, armado desde la planilla de operaciones. Cada persona ve solo sus números.
          </p>
        </div>
        <p className="relative mt-12 text-meta text-stage-3/70">Maqueta con datos reales de 2026 · Octubre 2026</p>
      </section>

      <section className="flex items-center justify-center px-6 py-14 md:px-14">
        <form onSubmit={entrar} className="w-full max-w-[380px] space-y-6" noValidate>
          <div>
            <h2 className="font-display text-h2 font-semibold tracking-[-.022em] text-ink">Entrá al tablero</h2>
            <p className="mt-2 text-base text-ink-3">Con el usuario y la contraseña que te pasó Gonzalo.</p>
          </div>
          <Field label="Usuario" htmlFor="usuario">
            <Input id="usuario" autoComplete="username" autoCapitalize="none" value={usuario} onChange={(e) => setUsuario(e.target.value)} className="h-11" autoFocus />
          </Field>
          <Field label="Contraseña" htmlFor="contrasena" error={error}>
            <Input
              id="contrasena"
              type="password"
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              aria-invalid={error ? true : undefined}
              className="h-11"
            />
          </Field>
          <Button type="submit" variant="primary" size="lg" className="w-full" loading={entrando} disabled={!usuario || !contrasena}>
            {entrando ? "Abriendo…" : "Entrar"}
          </Button>
          <p className="flex items-start gap-2 text-meta text-ink-3">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
            Los datos viajan cifrados con tu contraseña y se abren solo en tu navegador.
          </p>
        </form>
      </section>
    </main>
  );
}
