import React, { createContext, useReducer } from 'react'

const initialState = {}

const reducer = (state, action) => {
  const { TYPE, payload } = action

  switch (TYPE) {
    case 'SET':
      return { ...state, ...payload }
    default:
      return initialState
  }
}

export const Context = createContext()

export const AppContext = ({ children }) => {
  const [userInfo, dispatch] = useReducer(reducer, initialState)

  return (
    <Context.Provider value={{ userInfo, dispatch }}>
      {children}
    </Context.Provider>
  )
}
