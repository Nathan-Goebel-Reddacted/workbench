// Le CV publié n'a ni drapeau de visibilité ni rang : le serveur n'expose que les CV
// visibles, déjà dans l'ordre choisi dans l'administration.
export type Cv = {
  id: string
  name: string
  fileUrl: string
}
