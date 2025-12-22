import { createPortal } from 'react-dom';
import type { Venda } from '../types';
import PedidoA4 from './PedidoA4';

interface PrintPedidoPortalProps {
  open: boolean;
  venda: Venda | null;
  parametros: any;
  formatarData: (data: string) => string;
  formatarMoeda: (valor: number) => string;
  calcularTotal: () => number;
  contas?: any[];
}

export function PrintPedidoPortal({ open, venda, parametros, formatarData, formatarMoeda, calcularTotal, contas }: PrintPedidoPortalProps) {
  if (!open || !venda) return null;
  return createPortal(
    <div className="hidden print:block fixed top-0 left-0 w-full bg-white z-[9999]">
      <PedidoA4
        venda={venda}
        parametros={parametros}
        formatarData={formatarData}
        formatarMoeda={formatarMoeda}
        calcularTotal={calcularTotal}
        contas={contas}
      />
    </div>,
    document.body
  );
}

export default PrintPedidoPortal;
