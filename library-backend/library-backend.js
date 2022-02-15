const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const mongoose = require('mongoose')
const config = require('./utils/config')
const Author = require('./models/author')
const Book = require('./models/book')
const User = require('./models/user')
const jwt = require('jsonwebtoken')

const MONGODB_URI = config.MONGODB_URI
const JWT_SECRET = process.env.SECRET

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`

  type Author {
    name: String!
    born: Int
    bookCount: Int!
    id: ID!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
        title: String!
        author: String!
        published: Int!
        genres: [String!]!
    ): Book!

    editAuthor(
        name: String!
        setBornTo: Int!
    ): Author

    createUser(
        username: String!
        favoriteGenre: String!
    ): User

    login(
        username: String!
        password: String!
    ): Token
  }
`

const resolvers = {
  Query: {

    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: async (root, args) => {

        const books = await Book.find({}).populate('author')
        
        if(!args.author && !args.genre){
            return books
        }

        else if(!args.genre){

            return books.filter(book => book.author.id === args.author.id)
        }
        else if(!args.author){
            return books.filter(book => book.genres.includes(args.genre))
        }

        return books.filter(book => book.author === args.author && book.genres.includes(args.genre)) 
    },

    allAuthors: async () => await Author.find({}),

    me: (root, args, context) => {

      return context.currentUser
    }
  },

  Author: {

      bookCount: async (root) => await Book.find({author: root.id}).countDocuments()
  },

  Mutation: {

    addBook: async (root, args, context) => {

        const loggedInUser = context.currentUser

        if(!loggedInUser){

          throw new AuthenticationError("Not authenticated")
        }

        const authors = await Author.find({})
        let bookAuthor

        if(!authors.find(author => author.name === args.author)){

          bookAuthor = new Author({
                name: args.author,
                born: null
            })
            
            try{
              await bookAuthor.save()
            }
            catch(error){

              if(error.message.includes('`name` is required')){
                throw new UserInputError(`Author cannot be empty`, {
                  invalidArgs: args,
                })
              }

              if(error.message.includes('minimum allowed length')){
                throw new UserInputError(`Author's name "${args.author}" is too short`, {
                  invalidArgs: args,
                })
              }
            }
        }
        else{

          bookAuthor = await Author.findOne({name: args.author})
        }
        
        const book = new Book({...args, author: bookAuthor})

        try{
          await book.save()
        }
        catch(error){
          
          if(error.message.includes('duplicate key')){
            throw new UserInputError(`Title "${args.title}" is already in library`, {
              invalidArgs: args,
            })
          }

          if(error.message.includes('minimum allowed length')){
            throw new UserInputError(`Title "${args.title}" is too short`, {
              invalidArgs: args,
            })
          }
        }

        return book
    },

    editAuthor: async (root, args, context) => {

        const loggedInUser = context.currentUser

        if(!loggedInUser){

          throw new AuthenticationError("Not authenticated")
        }

        let authors = await Author.find({})

        const author = authors.find(author => author.name === args.name)

        if(author){

            author.born = args.setBornTo
            
            try{

              await author.save()
            }
            catch(error){

              throw new UserInputError(error.message, {
                invalidArgs: args,
              })
            }

            return author
        }
    },

    createUser: async (root, args) => {

      const user = new User({username: args.username, favoriteGenre: args.favoriteGenre})

      try{
        await user.save()
      }
      catch(error){

        throw new UserInputError(error.message, {
          invalidArgs: args,
        })
      }

      return user
    },

    login: async (root, args) => {

      const user = await User.findOne({username: args.username})

      // password is hardcoded, as stated and permitted in the exercise 8.16
      if(!user || args.password !== 'password'){

        throw new UserInputError('Wrong credentials', {
          invalidArgs: args,
        })
      }

      const userForToken = {

        username: user.username,
        id: user._id
      }

      return {value: jwt.sign(userForToken, JWT_SECRET)}
    }
  }
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({req}) => {

    const auth = req ? req.headers.authorization : null

    if(auth && auth.toLowerCase().startsWith('bearer ')){

      const decodedToken = jwt.verify(
        auth.substring(7), JWT_SECRET
      )

      const currentUser = await User.findById(decodedToken.id)

      return {currentUser}
    }
  }
})

server.listen().then(({ url }) => {
  console.log(`Server ready at ${url}`)
})