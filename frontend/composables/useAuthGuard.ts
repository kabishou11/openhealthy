/**
 * useAuthGuard - composable for role-based page protection
 * Call in onMounted to redirect unauthorized users.
 */
import { useAuthStore } from '~/stores/auth'

export function useAuthGuard(allowedRoles?: string[]) {
  const authStore = useAuthStore()
  const router = useRouter()

  const check = () => {
    authStore.init()
    if (!authStore.isAuthenticated) {
      router.push('/login')
      return false
    }
    if (allowedRoles && allowedRoles.length > 0) {
      if (!allowedRoles.includes(authStore.userRole)) {
        router.push('/dashboard')
        return false
      }
    }
    return true
  }

  onMounted(check)

  return { authStore, check }
}
