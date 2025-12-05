import { useEffect } from 'react'

export interface TemaConfig {
  primaria: string
  secundaria: string
  destaque: string
  fundo: string
  texto: string
  borda: string
}

export const useTema = () => {
  useEffect(() => {
    // Carregar tema ativo ao montar
    carregarTemaAtivo()
  }, [])

  const carregarTemaAtivo = () => {
    const temaSalvo = localStorage.getItem('tema-sistema-ativo')
    if (temaSalvo) {
      try {
        const tema = JSON.parse(temaSalvo)
        aplicarCoresCSS(tema.cores)
      } catch (error) {
        console.error('Erro ao carregar tema:', error)
      }
    }
  }

  const aplicarCoresCSS = (cores: TemaConfig) => {
    const root = document.documentElement
    root.style.setProperty('--cor-primaria', cores.primaria)
    root.style.setProperty('--cor-secundaria', cores.secundaria)
    root.style.setProperty('--cor-destaque', cores.destaque)
    root.style.setProperty('--cor-fundo', cores.fundo)
    root.style.setProperty('--cor-texto', cores.texto)
    root.style.setProperty('--cor-borda', cores.borda)
  }

  return { carregarTemaAtivo }
}
