import { configureStore } from '@reduxjs/toolkit'

import quickViewReducer from './features/quickView-slice'
import cartReducer from './features/cart-slice'
import wishlistReducer from './features/wishlist-slice'
import productDetailsReducer from './features/product-details'
import { cartPersistenceMiddleware } from './middleware/cartPersistence'

import { TypedUseSelectorHook, useSelector, useDispatch } from 'react-redux'

export const store = configureStore({
  reducer: {
    quickViewReducer,
    cartReducer,
    wishlistReducer,
    productDetailsReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorar estas acciones para el check de serialización
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(cartPersistenceMiddleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
export const useAppDispatch = () => useDispatch<AppDispatch>()
