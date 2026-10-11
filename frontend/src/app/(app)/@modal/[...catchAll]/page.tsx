// Ao navegar para qualquer outra rota (ex.: voltar à listagem após excluir), o popup precisa sumir:
// sem isto, o slot manteria o último conteúdo aberto.
export default function NoModal() {
  return null;
}
