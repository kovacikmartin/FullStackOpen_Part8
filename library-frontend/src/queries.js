import { gql  } from '@apollo/client'

export const ALL_AUTHORS = gql`

  query {
    allAuthors {
      name
      born
      bookCount
    }
  }
`

export const ALL_BOOKS = gql`

  query {
    allBooks {
      title
      author {
        name
        born
        bookCount
      }
      published
    }
  }
`

export const CREATE_BOOK = gql`

  mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
    addBook(
      title: $title,
      author: $author,
      published: $published,
      genres: $genres
    ) {
        title
        author{
          name
        }
        published
        genres
    }
  }
`

export const SET_BIRTHYEAR = gql`

  mutation setBirthyear($name: String!, $born: Int!) {
      editAuthor(
          name: $name,
          setBornTo: $born
      ) {
          name
          born
          bookCount
      }
  }
`

export const LOGIN = gql`
  mutation login($username: String!, $password: String!) {
    login(username: $username, password: $password)  {
      value
    }
  }
`