import React, { useState } from 'react'
import { useQuery, useApolloClient } from '@apollo/client'
import Authors from './components/Authors'
import AuthorSetBirthyear from './components/AuthorSetBirthyear'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { ALL_AUTHORS, ALL_BOOKS } from './queries'

const Notify = ({ errorMessage }) => {
  if (!errorMessage) {
    return null
  }
  return <div style = {{ color: 'red' }}> {errorMessage} </div>
}

const App = () => {

  const [page, setPage] = useState('authors')
  const [token, setToken] = useState(localStorage.getItem("library-user-token"))
  const [errorMessage, setErrorMessage] = useState(null)
  const client = useApolloClient()

  const authors = useQuery(ALL_AUTHORS)
  const books = useQuery(ALL_BOOKS)

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  // code handling login and logout was taken from
  // https://github.com/fullstack-hy2020/graphql-phonebook-frontend/blob/part8-6/src/components/LoginForm.js
  // username: martin, password: password
  if(!token){
    return (
        <div>
          <h2>Login</h2>
          <Notify errorMessage={errorMessage} />
          <LoginForm setToken={setToken} setError={notify}/>
        </div>
    )
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={logout}>logout</button>
      </div>

      {authors.loading ?

          null 
          :
          <div>
            <Authors
              show={page === 'authors'}
              authors={authors.data.allAuthors}
            /><br />
            
            <AuthorSetBirthyear 
              show={page === 'authors'}
            />
          </div>
      }
      
      {books.loading ?
        
          null
          :
          <Books
            show={page === 'books'}
            books={books.data.allBooks}
          />
      }

      <NewBook
        show={page === 'add'}
      />

    </div>
  )
}

export default App