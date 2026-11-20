import { usePopup } from '@-reddacted-/react-ui'

export function useShowPopup(): (message: string) => void {
  return usePopup().push
}
