import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

/**
 * What a cart button does now that there can be several baskets: open the only
 * one straight away, or show the list when there is a choice to make.
 */
export function useCartEntry(): () => void {
  const { carts, setActiveStore, openCart } = useApp()
  const navigate = useNavigate()

  return () => {
    const only = carts.length === 1 ? carts[0] : undefined
    if (!only) {
      navigate('/carts')
      return
    }
    setActiveStore(only.store.id)
    openCart()
  }
}
