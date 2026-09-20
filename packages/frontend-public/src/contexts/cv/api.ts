import { getJson } from '../../shared/api/http'
import { uploadUrl } from '../../shared/config'
import type { Cv } from './types'

type CvDto = { id: string; name: string; fileUrl: string }

export async function listPublishedCvs(signal?: AbortSignal): Promise<Cv[]> {
  const dtos = await getJson<CvDto[]>('/cvs', signal)
  return (dtos ?? []).map(dto => ({ id: dto.id, name: dto.name, fileUrl: uploadUrl(dto.fileUrl) }))
}
