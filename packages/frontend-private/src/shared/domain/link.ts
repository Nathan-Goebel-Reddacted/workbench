export type Link = { url: string; displayText: string; logo: string }

export type LinkStore = {
  add(link: Link): Promise<void>
  remove(link: Link): Promise<void>
}
